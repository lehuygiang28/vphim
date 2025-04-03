// proxy.ts
// High-performance Bun proxy server with advanced streaming and load protection

// Bun type definition
// @ts-ignore
declare const Bun: any;

// Configuration
const CONFIG = {
    port: parseInt(process.env.PORT || '3001', 10),
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '500', 10),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '30000', 10),
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '700', 10), // Per IP
    logLevel: process.env.LOG_LEVEL || 'info', // 'debug' | 'info' | 'warn' | 'error'
    logFormat: process.env.LOG_FORMAT || 'json', // 'json' | 'text'
    logToFile: process.env.LOG_TO_FILE === 'true', // Disabled by default
    logFilePath: process.env.LOG_FILE_PATH || './logs/proxy-server.log',
    referrerTracking: process.env.REFERRER_TRACKING !== 'false', // Enabled by default
    referrerLogInterval: parseInt(process.env.REFERRER_LOG_INTERVAL || '3600000', 10), // Default to hourly
    // CORS configuration
    cors: {
        enabled: process.env.CORS_ENABLED !== 'false', // Enabled by default
        allowOrigin: process.env.CORS_ALLOW_ORIGIN || '*', // Allow all origins by default
        allowMethods: process.env.CORS_ALLOW_METHODS || 'GET, POST, PUT, DELETE, OPTIONS',
        allowHeaders:
            process.env.CORS_ALLOW_HEADERS ||
            'Content-Type, Authorization, Range, Origin, X-Requested-With',
        exposeHeaders:
            process.env.CORS_EXPOSE_HEADERS || 'Content-Length, Content-Range, Content-Disposition',
        allowCredentials: process.env.CORS_ALLOW_CREDENTIALS === 'true' || false,
        maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10), // 24 hours by default
    },
};

// Logger implementation
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: Record<string, unknown>;
}

class Logger {
    private level: LogLevel;
    private format: 'json' | 'text';
    private logToFile: boolean;
    private logFilePath: string;
    private logFile: any | null = null;

    constructor(options: {
        level: LogLevel;
        format: 'json' | 'text';
        logToFile: boolean;
        logFilePath: string;
    }) {
        this.level = options.level;
        this.format = options.format;
        this.logToFile = options.logToFile;
        this.logFilePath = options.logFilePath;

        // Only attempt to initialize log file if explicitly enabled
        if (this.logToFile && process.env.LOG_TO_FILE === 'true') {
            try {
                this.logFile = Bun.file(this.logFilePath).writer();
                console.log(`Log file initialized at: ${this.logFilePath}`);
            } catch (error) {
                console.error(
                    `Failed to open log file: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                );
                this.logToFile = false;
            }
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: Record<LogLevel, number> = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };

        return levels[level] >= levels[this.level];
    }

    private formatLog(logData: LogMessage): string {
        if (this.format === 'json') {
            return JSON.stringify(logData);
        } else {
            return `[${logData.timestamp}] [${logData.level.toUpperCase()}] ${logData.message}${
                logData.data ? ' ' + JSON.stringify(logData.data) : ''
            }`;
        }
    }

    private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const logData: LogMessage = { timestamp, level, message, data };
        const formattedLog = this.formatLog(logData);

        // Console output
        if (level === 'error') {
            console.error(formattedLog);
        } else if (level === 'warn') {
            console.warn(formattedLog);
        } else {
            console.log(formattedLog);
        }

        // File output - only if explicitly enabled
        if (this.logToFile && this.logFile && process.env.LOG_TO_FILE === 'true') {
            try {
                this.logFile.write(formattedLog + '\n');
            } catch (error) {
                console.error(
                    `Failed to write to log file: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                );
                // Don't disable logging here, just report the error
            }
        }
    }

    debug(message: string, data?: Record<string, unknown>): void {
        this.log('debug', message, data);
    }

    info(message: string, data?: Record<string, unknown>): void {
        this.log('info', message, data);
    }

    warn(message: string, data?: Record<string, unknown>): void {
        this.log('warn', message, data);
    }

    error(message: string, data?: Record<string, unknown>): void {
        this.log('error', message, data);
    }

    close(): void {
        if (this.logFile) {
            try {
                this.logFile.flush();
                this.logFile.close();
            } catch (error) {
                console.error(
                    `Error closing log file: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                );
            }
        }
    }
}

// Initialize logger
const logger = new Logger({
    level: CONFIG.logLevel as LogLevel,
    format: CONFIG.logFormat as 'json' | 'text',
    logToFile: CONFIG.logToFile,
    logFilePath: CONFIG.logFilePath,
});

// Referrer Tracker
class ReferrerTracker {
    private referrers: Map<string, number> = new Map();
    private lastReset: number = Date.now();
    private readonly resetInterval: number;

    constructor(resetInterval: number = 3600000) {
        // Default: 1 hour
        this.resetInterval = resetInterval;
    }

    trackReferrer(referrerUrl: string | null): void {
        if (!referrerUrl) {
            this.incrementReferrer('direct');
            return;
        }

        try {
            // Extract just the hostname to group by domain
            const hostname = new URL(referrerUrl).hostname;
            this.incrementReferrer(hostname || 'unknown');
        } catch (e) {
            // If URL parsing fails, store as-is
            this.incrementReferrer(referrerUrl);
        }
    }

    private incrementReferrer(referrer: string): void {
        const count = this.referrers.get(referrer) || 0;
        this.referrers.set(referrer, count + 1);
    }

    getTopReferrers(limit: number = 10): Array<{ referrer: string; count: number }> {
        return [...this.referrers.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([referrer, count]) => ({ referrer, count }));
    }

    getTotalRequests(): number {
        return [...this.referrers.values()].reduce((sum, count) => sum + count, 0);
    }

    resetIfNeeded(): boolean {
        const now = Date.now();
        if (now - this.lastReset > this.resetInterval) {
            this.referrers.clear();
            this.lastReset = now;
            return true;
        }
        return false;
    }

    getReferrerStats(): Record<string, unknown> {
        return {
            topReferrers: this.getTopReferrers(),
            totalTracked: this.getTotalRequests(),
            trackingSince: new Date(this.lastReset).toISOString(),
        };
    }
}

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
            logger.debug(`New rate limit entry for IP: ${ip}`);
            return false;
        }

        // Reset counter if time expired
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + 60000;
            logger.debug(`Rate limit reset for IP: ${ip}`);
            return false;
        }

        // Check if rate limit exceeded
        if (record.count >= CONFIG.rateLimitPerMinute) {
            logger.warn(`Rate limit exceeded for IP: ${ip}, count: ${record.count}`);
            return true;
        }

        // Increment counter
        record.count++;
        return false;
    }

    // Clean up old entries (call periodically)
    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;
        for (const [ip, record] of this.requests.entries()) {
            if (now > record.resetTime) {
                this.requests.delete(ip);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
        }
    }
}

// Circuit breaker to prevent overload
class CircuitBreaker {
    private _activeRequests = 0;
    private isBroken = false;
    private breakCount = 0;

    get activeRequests(): number {
        return this._activeRequests;
    }

    canAcceptRequest(): boolean {
        if (this.isBroken) {
            // If in broken state, only allow a trickle of requests
            if (Math.random() < 0.05) {
                // 5% chance
                logger.debug(`Circuit breaker allowing trickle request while broken`);
                return true;
            }
            return false;
        }

        if (this._activeRequests >= CONFIG.maxConcurrentRequests) {
            this.isBroken = true;
            this.breakCount++;
            logger.warn(
                `Circuit breaker tripped. Active requests: ${this._activeRequests}, Break count: ${this.breakCount}`,
            );

            // Auto-reset after 10 seconds
            setTimeout(() => {
                this.isBroken = false;
                logger.info(`Circuit breaker reset after 10s`);
            }, 10000);
            return false;
        }

        return true;
    }

    startRequest(): void {
        this._activeRequests++;
        if (this._activeRequests % 50 === 0) {
            logger.debug(`Active requests: ${this._activeRequests}`);
        }
    }

    endRequest(): void {
        this._activeRequests = Math.max(0, this._activeRequests - 1);
    }

    getStatus(): Record<string, unknown> {
        return {
            activeRequests: this._activeRequests,
            isBroken: this.isBroken,
            breakCount: this.breakCount,
            maxConcurrentRequests: CONFIG.maxConcurrentRequests,
        };
    }
}

// Setup protection mechanisms
const rateLimiter = new RateLimiter();
const circuitBreaker = new CircuitBreaker();
const referrerTracker = new ReferrerTracker(CONFIG.referrerLogInterval);

// Cleanup rate limiter every 5 minutes
setInterval(() => {
    rateLimiter.cleanup();
}, 5 * 60 * 1000);

// Log stats every minute in production
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        logger.info('Proxy server stats', {
            ...stats,
            ...circuitBreaker.getStatus(),
            uptime: process.uptime(),
        });
    }, 60 * 1000);
}

// Log referrer stats periodically
if (CONFIG.referrerTracking) {
    setInterval(() => {
        if (referrerTracker.getTotalRequests() > 0) {
            logger.info('Referrer tracking stats', referrerTracker.getReferrerStats());
        }

        // Reset if needed (based on tracking interval)
        if (referrerTracker.resetIfNeeded()) {
            logger.info('Referrer tracking reset');
        }
    }, Math.min(CONFIG.referrerLogInterval, 3600000)); // Log at least hourly
}

// Monitoring stats
const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitedRequests: 0,
    circuitBrokenRequests: 0,
    bytesTransferred: 0,
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

// Extract referrer domain
function extractReferrerInfo(request: Request): {
    referrerUrl: string | null;
    referrerDomain: string | null;
} {
    const referrer = request.headers.get('referer');
    if (!referrer) {
        return { referrerUrl: null, referrerDomain: null };
    }

    try {
        const url = new URL(referrer);
        return {
            referrerUrl: referrer,
            referrerDomain: url.hostname,
        };
    } catch (e) {
        return {
            referrerUrl: referrer,
            referrerDomain: null,
        };
    }
}

// Request ID generator for tracking requests
function generateRequestId(): string {
    return (
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
}

// Enhanced response tracking with byte counting
class TrackedResponse extends Response {
    private bytesWritten = 0;
    private originalBody: ReadableStream<Uint8Array> | null;
    private requestId: string;

    constructor(body: ReadableStream<Uint8Array> | null, init: ResponseInit, requestId: string) {
        // If there's a body, we'll replace it with our tracked version
        const trackedBody = body
            ? new ReadableStream<Uint8Array>({
                  start: (controller) => {
                      const reader = body.getReader();

                      const pump = async (): Promise<void> => {
                          try {
                              const { done, value } = await reader.read();

                              if (done) {
                                  controller.close();
                                  return;
                              }

                              if (value) {
                                  this.bytesWritten += value.byteLength;
                                  controller.enqueue(value);
                              }

                              return pump();
                          } catch (err) {
                              controller.error(err);
                              logger.error(
                                  `Error in stream processing [${requestId}]: ${
                                      err instanceof Error ? err.message : String(err)
                                  }`,
                              );
                          }
                      };

                      pump().catch((err) => {
                          logger.error(
                              `Fatal error in stream pump [${requestId}]: ${
                                  err instanceof Error ? err.message : String(err)
                              }`,
                          );
                      });
                  },
              })
            : null;

        super(trackedBody, init);
        this.originalBody = body;
        this.requestId = requestId;
    }

    get transferredBytes(): number {
        return this.bytesWritten;
    }
}

Bun.serve({
    port: CONFIG.port,
    development: process.env.NODE_ENV !== 'production',
    async fetch(request: Request): Promise<Response> {
        const startTime = performance.now();
        const requestId = generateRequestId();
        stats.totalRequests++;

        // Get client IP for rate limiting and logging
        const clientIP = getClientIP(request);
        const url = new URL(request.url);
        const method = request.method;

        // Handle OPTIONS requests for CORS preflight
        if (method === 'OPTIONS' && CONFIG.cors.enabled) {
            logger.debug(`[${requestId}] Handling CORS preflight request`);

            const headers = new Headers();
            headers.set('Access-Control-Allow-Origin', CONFIG.cors.allowOrigin);
            headers.set('Access-Control-Allow-Methods', CONFIG.cors.allowMethods);
            headers.set('Access-Control-Allow-Headers', CONFIG.cors.allowHeaders);
            headers.set('Access-Control-Max-Age', CONFIG.cors.maxAge.toString());

            if (CONFIG.cors.allowCredentials) {
                headers.set('Access-Control-Allow-Credentials', 'true');
            }

            // Add request ID and timing for consistency
            headers.set('X-Request-ID', requestId);
            headers.set('X-Proxy-Time', `${(performance.now() - startTime).toFixed(2)}ms`);

            return new Response(null, {
                status: 204,
                headers,
            });
        }

        // Extract and track referrer information
        const { referrerUrl, referrerDomain } = extractReferrerInfo(request);
        if (CONFIG.referrerTracking && referrerUrl) {
            referrerTracker.trackReferrer(referrerUrl);
        }

        // Log the incoming request with referrer information
        logger.debug(`[${requestId}] ${method} ${url.pathname}${url.search}`, {
            clientIP,
            userAgent: request.headers.get('user-agent'),
            referrer: referrerDomain || 'none',
            fullReferrer: referrerUrl,
        });

        try {
            // Check rate limit
            if (rateLimiter.isRateLimited(clientIP)) {
                stats.rateLimitedRequests++;
                logger.warn(`[${requestId}] Rate limit exceeded for ${clientIP}`, {
                    referrer: referrerDomain || 'none',
                });
                return new Response('Rate limit exceeded. Try again later.', {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-Request-ID': requestId,
                    },
                });
            }

            // Check circuit breaker
            if (!circuitBreaker.canAcceptRequest()) {
                stats.circuitBrokenRequests++;
                logger.warn(`[${requestId}] Circuit breaker triggered. Request rejected.`, {
                    referrer: referrerDomain || 'none',
                });
                return new Response('Server is experiencing high load. Try again later.', {
                    status: 503,
                    headers: {
                        'Retry-After': '10',
                        'X-Request-ID': requestId,
                    },
                });
            }

            // Mark start of request processing
            circuitBreaker.startRequest();

            const reqUrl = new URL(request.url);

            // Handle stats endpoint
            if (reqUrl.pathname === '/proxy-stats') {
                logger.debug(`[${requestId}] Serving stats endpoint`);
                return new Response(
                    JSON.stringify({
                        ...stats,
                        ...circuitBreaker.getStatus(),
                        uptime: process.uptime(),
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Request-ID': requestId,
                        },
                    },
                );
            }

            // Handle referrer stats endpoint
            if (reqUrl.pathname === '/referrer-stats' && CONFIG.referrerTracking) {
                logger.debug(`[${requestId}] Serving referrer stats endpoint`);
                return new Response(JSON.stringify(referrerTracker.getReferrerStats()), {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Request-ID': requestId,
                    },
                });
            }

            // Handle health check endpoint
            if (reqUrl.pathname === '/health') {
                return new Response(JSON.stringify({ status: 'ok' }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Request-ID': requestId,
                    },
                });
            }

            const target = reqUrl.searchParams.get('url');

            // Validate the target URL
            if (!target) {
                logger.warn(`[${requestId}] Missing URL parameter`, {
                    referrer: referrerDomain || 'none',
                });
                return new Response("Missing 'url' query parameter.", {
                    status: 400,
                    headers: { 'X-Request-ID': requestId },
                });
            }

            let targetUrl: URL;
            try {
                targetUrl = new URL(target);
                logger.debug(`[${requestId}] Proxying to: ${targetUrl.toString()}`, {
                    referrer: referrerDomain || 'none',
                });
            } catch {
                logger.warn(`[${requestId}] Invalid URL: ${target}`, {
                    referrer: referrerDomain || 'none',
                });
                return new Response('Invalid URL provided.', {
                    status: 400,
                    headers: { 'X-Request-ID': requestId },
                });
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
            logger.debug(`[${requestId}] Fetching from target URL`);
            const fetchStartTime = performance.now();
            const originResponse = await fetch(targetUrl.toString(), requestInit);
            const fetchDuration = performance.now() - fetchStartTime;

            logger.debug(
                `[${requestId}] Target responded with status ${
                    originResponse.status
                } in ${fetchDuration.toFixed(2)}ms`,
            );

            // Set up response headers with performance optimizations
            const responseHeaders = new Headers();

            // Add request ID to response for tracking
            responseHeaders.set('X-Request-ID', requestId);

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

            // Apply CORS headers according to configuration
            if (CONFIG.cors.enabled) {
                responseHeaders.set('Access-Control-Allow-Origin', CONFIG.cors.allowOrigin);
                responseHeaders.set('Access-Control-Allow-Methods', CONFIG.cors.allowMethods);
                responseHeaders.set('Access-Control-Allow-Headers', CONFIG.cors.allowHeaders);
                responseHeaders.set('Access-Control-Expose-Headers', CONFIG.cors.exposeHeaders);
                responseHeaders.set('Access-Control-Max-Age', CONFIG.cors.maxAge.toString());

                if (CONFIG.cors.allowCredentials) {
                    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
                }
            }

            // Support for range requests (essential for video streaming)
            if (request.headers.has('range')) {
                responseHeaders.set('Accept-Ranges', 'bytes');
            }

            // Use native streaming in Bun for better performance with response tracking
            // This ensures we don't buffer the entire response in memory
            const trackedResponse = new TrackedResponse(
                originResponse.body,
                {
                    status: originResponse.status,
                    statusText: originResponse.statusText,
                    headers: responseHeaders,
                },
                requestId,
            );

            // Track successful request
            stats.successfulRequests++;

            // Set up cleanup when the response is done
            // This ensures we track when requests end even if the client disconnects
            setTimeout(() => {
                circuitBreaker.endRequest();

                // Log the completed request with timing information
                const totalDuration = performance.now() - startTime;
                logger.info(`[${requestId}] Request completed`, {
                    status: originResponse.status,
                    method,
                    url: url.pathname,
                    clientIP,
                    duration: totalDuration.toFixed(2) + 'ms',
                    targetUrl: targetUrl.toString(),
                    bytesTransferred: trackedResponse.transferredBytes,
                    referrer: referrerDomain || 'none',
                });

                // Update total bytes transferred
                stats.bytesTransferred += trackedResponse.transferredBytes;
            }, 100); // Small delay to ensure response starts streaming

            return trackedResponse;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`[${requestId}] Proxy error: ${errorMessage}`, {
                clientIP,
                url: url.toString(),
                referrer: referrerDomain || 'none',
                stack: error instanceof Error ? error.stack : undefined,
            });

            // Track failed request
            stats.failedRequests++;

            // Always clean up resources
            circuitBreaker.endRequest();

            // Provide detailed error response
            return new Response(`Proxy error: ${errorMessage}`, {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Proxy-Time': `${(performance.now() - startTime).toFixed(2)}ms`,
                    'X-Request-ID': requestId,
                },
            });
        }
    },
});

// Log startup information
logger.info(`🚀 High-performance proxy server running on http://localhost:${CONFIG.port}`, {
    environment: process.env.NODE_ENV || 'development',
    configuration: {
        ...CONFIG,
        logFilePath: process.env.LOG_TO_FILE === 'true' ? CONFIG.logFilePath : 'disabled',
        cors: {
            ...CONFIG.cors,
            status: CONFIG.cors.enabled ? 'enabled' : 'disabled',
            allowOrigin: CONFIG.cors.allowOrigin,
        },
    },
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT. Shutting down gracefully...');
    // Close logger and any other resources
    logger.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Shutting down gracefully...');
    // Close logger and any other resources
    logger.close();
    process.exit(0);
});
