// proxy.ts
// High-performance Bun proxy server with advanced streaming and load protection

// Configuration
const CONFIG = {
    port: 3001,
    maxConcurrentRequests: 500,
    timeoutMs: 30000,
    rateLimitPerMinute: 700, // Per IP
};

// Simple in-memory rate limiter
class RateLimiter {
    private requests: Map<string, { count: number; resetTime: number }> = new Map();

    isRateLimited(ip: string): boolean {
        const now = Date.now();
        const record = this.requests.get(ip);

        if (!record) {
            this.requests.set(ip, {
                count: 1,
                resetTime: now + 60000, // 1 minute
            });
            return false;
        }

        // Reset counter if time expired
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + 60000;
            return false;
        }

        // Check if rate limit exceeded
        if (record.count >= CONFIG.rateLimitPerMinute) {
            return true;
        }

        // Increment counter
        record.count++;
        return false;
    }

    // Clean up old entries (call periodically)
    cleanup(): void {
        const now = Date.now();
        for (const [ip, record] of this.requests.entries()) {
            if (now > record.resetTime) {
                this.requests.delete(ip);
            }
        }
    }
}

// Circuit breaker to prevent overload
class CircuitBreaker {
    private _activeRequests = 0;
    private isBroken = false;

    get activeRequests(): number {
        return this._activeRequests;
    }

    canAcceptRequest(): boolean {
        if (this.isBroken) {
            // If in broken state, only allow a trickle of requests
            if (Math.random() < 0.05) {
                // 5% chance
                return true;
            }
            return false;
        }

        if (this._activeRequests >= CONFIG.maxConcurrentRequests) {
            this.isBroken = true;
            // Auto-reset after 10 seconds
            setTimeout(() => {
                this.isBroken = false;
            }, 10000);
            return false;
        }

        return true;
    }

    startRequest(): void {
        this._activeRequests++;
    }

    endRequest(): void {
        this._activeRequests = Math.max(0, this._activeRequests - 1);
    }
}

// Setup protection mechanisms
const rateLimiter = new RateLimiter();
const circuitBreaker = new CircuitBreaker();

// Cleanup rate limiter every 5 minutes
setInterval(() => {
    rateLimiter.cleanup();
}, 5 * 60 * 1000);

// Monitoring stats
const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitedRequests: 0,
    circuitBrokenRequests: 0,
};

// Helper to extract client IP
function getClientIP(request: Request): string {
    // Get IP from headers if behind a proxy
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // Otherwise fallback to a default
    return '127.0.0.1';
}

Bun.serve({
    port: CONFIG.port,
    development: process.env.NODE_ENV !== 'production',
    async fetch(request: Request): Promise<Response> {
        const startTime = performance.now();
        stats.totalRequests++;

        try {
            // Get client IP for rate limiting
            const clientIP = getClientIP(request);

            // Check rate limit
            if (rateLimiter.isRateLimited(clientIP)) {
                stats.rateLimitedRequests++;
                return new Response('Rate limit exceeded. Try again later.', {
                    status: 429,
                    headers: { 'Retry-After': '60' },
                });
            }

            // Check circuit breaker
            if (!circuitBreaker.canAcceptRequest()) {
                stats.circuitBrokenRequests++;
                return new Response('Server is experiencing high load. Try again later.', {
                    status: 503,
                    headers: { 'Retry-After': '10' },
                });
            }

            // Mark start of request processing
            circuitBreaker.startRequest();

            const reqUrl = new URL(request.url);

            // Handle stats endpoint
            if (reqUrl.pathname === '/proxy-stats') {
                return new Response(
                    JSON.stringify({
                        ...stats,
                        activeRequests: circuitBreaker.activeRequests,
                        uptime: process.uptime(),
                    }),
                    {
                        headers: { 'Content-Type': 'application/json' },
                    },
                );
            }

            const target = reqUrl.searchParams.get('url');

            // Validate the target URL
            if (!target) {
                return new Response("Missing 'url' query parameter.", { status: 400 });
            }

            let targetUrl: URL;
            try {
                targetUrl = new URL(target);
            } catch {
                return new Response('Invalid URL provided.', { status: 400 });
            }

            // Extract original filename from path
            const pathSegments = targetUrl.pathname.split('/');
            const originalFilename = pathSegments[pathSegments.length - 1];

            // Preserve query parameters from the original target URL
            const originalParams = Array.from(targetUrl.searchParams.entries());

            // Add query parameters from the proxy request (except 'url')
            for (const [key, value] of reqUrl.searchParams.entries()) {
                if (key !== 'url') {
                    targetUrl.searchParams.append(key, value);
                }
            }

            // Prepare headers for the target request
            const headers = new Headers(request.headers);
            headers.delete('host'); // Remove the host header to avoid conflicts
            headers.delete('origin');
            headers.delete('referer');
            headers.set(
                'user-agent',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            );

            // Create request options with proper timeout
            const requestInit: RequestInit = {
                method: request.method,
                headers,
                redirect: 'follow',
                signal: AbortSignal.timeout(CONFIG.timeoutMs), // 30 second timeout
            };

            // Only add body for appropriate HTTP methods
            if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
                // Efficiently handle request body - stream if possible
                requestInit.body = request.body;
            }

            // Fetch from the target with optimized settings
            const originResponse = await fetch(targetUrl.toString(), requestInit);

            // Set up response headers with performance optimizations
            const responseHeaders = new Headers();

            // Handle content type and disposition
            if (originalFilename) {
                const extension = originalFilename.split('.').pop()?.toLowerCase();

                // Set appropriate content type for streaming video files
                if (extension === 'ts') {
                    responseHeaders.set('Content-Type', 'video/mp2t');
                } else if (extension === 'm3u8') {
                    responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
                } else if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
                    const mimeTypes: Record<string, string> = {
                        mp4: 'video/mp4',
                        webm: 'video/webm',
                        ogg: 'video/ogg',
                    };
                    responseHeaders.set('Content-Type', mimeTypes[extension || '']);
                } else {
                    // Copy the original content type if we can't determine it
                    responseHeaders.set(
                        'Content-Type',
                        originResponse.headers.get('content-type') || 'application/octet-stream',
                    );
                }

                // Make sure to set content disposition with the original filename
                responseHeaders.set(
                    'Content-Disposition',
                    `inline; filename="${originalFilename}"`,
                );
            } else {
                // Copy original content type
                responseHeaders.set(
                    'Content-Type',
                    originResponse.headers.get('content-type') || 'application/octet-stream',
                );
            }

            // Copy important headers from the origin response
            const headersToCopy = [
                'content-length',
                'content-range',
                'accept-ranges',
                'last-modified',
                'etag',
            ];

            for (const header of headersToCopy) {
                const value = originResponse.headers.get(header);
                if (value) {
                    responseHeaders.set(header, value);
                }
            }

            // Standard cache and CORS headers
            const tenYearsInSeconds = 315360000; // 10 years in seconds
            responseHeaders.set(
                'Cache-Control',
                originalFilename &&
                    ['ts', 'mp4', 'webm', 'ogg'].includes(
                        originalFilename.split('.').pop()?.toLowerCase() || '',
                    )
                    ? `public, max-age=${tenYearsInSeconds}, immutable`
                    : originResponse.headers.get('cache-control') || 'public, max-age=3600',
            );
            // For CDNs like Cloudflare
            responseHeaders.set(
                'CDN-Cache-Control',
                `public, max-age=${tenYearsInSeconds}, immutable`,
            );
            responseHeaders.set(
                'Expires',
                new Date(Date.now() + tenYearsInSeconds * 1000).toUTCString(),
            );
            responseHeaders.set('X-Proxy-Time', `${(performance.now() - startTime).toFixed(2)}ms`);
            responseHeaders.set('Access-Control-Allow-Origin', '*');
            responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            responseHeaders.set(
                'Access-Control-Allow-Headers',
                'Content-Type, Authorization, Range',
            );
            responseHeaders.set(
                'Access-Control-Expose-Headers',
                'Content-Length, Content-Range, Content-Disposition',
            );

            // Support for range requests (essential for video streaming)
            if (request.headers.has('range')) {
                responseHeaders.set('Accept-Ranges', 'bytes');
            }

            // Use native streaming in Bun for better performance
            // This ensures we don't buffer the entire response in memory
            const response = new Response(originResponse.body, {
                status: originResponse.status,
                statusText: originResponse.statusText,
                headers: responseHeaders,
            });

            // Track successful request
            stats.successfulRequests++;

            // Set up cleanup when the response is done
            // This ensures we track when requests end even if the client disconnects
            setTimeout(() => {
                circuitBreaker.endRequest();
            }, 100); // Small delay to ensure response starts streaming

            return response;
        } catch (error) {
            console.error('Proxy error:', error instanceof Error ? error.message : String(error));

            // Track failed request
            stats.failedRequests++;

            // Always clean up resources
            circuitBreaker.endRequest();

            // Provide detailed error response
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new Response(`Proxy error: ${errorMessage}`, {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Proxy-Time': `${(performance.now() - startTime).toFixed(2)}ms`,
                },
            });
        }
    },
});

console.log(`🚀 High-performance proxy server running on http://localhost:${CONFIG.port}`);
