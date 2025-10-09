import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const runtime = 'nodejs';

// Environment variables for configuration
const TARGET_API_URL = process.env.TARGET_API_URL;
const CUSTOM_HEADERS: Record<string, string> = process.env.CUSTOM_HEADERS
    ? JSON.parse(process.env.CUSTOM_HEADERS)
    : {};
const HIDDEN_RESPONSE_HEADERS = process.env.HIDDEN_RESPONSE_HEADERS
    ? process.env.HIDDEN_RESPONSE_HEADERS.split(',').map((h) => h.trim().toLowerCase())
    : [];

// Utility: join base and path with single slash
function joinUrl(base: string, path: string): string {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${normalizedBase}/${normalizedPath}`;
}

// Build a proxy fetch against TARGET_API_URL, preserving method, headers, body, and query
async function proxyRequest(incoming: Request, slugPath: string): Promise<Response> {
    if (!TARGET_API_URL) {
        return new Response(JSON.stringify({ error: 'TARGET_API_URL not configured' }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }

    const incomingUrl = new URL(incoming.url);
    const search = incomingUrl.search ? incomingUrl.search : '';
    const targetUrl = joinUrl(TARGET_API_URL, slugPath) + search;

    // Prepare headers for the target request
    const targetHeaders = new Headers();
    incoming.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (
            ![
                'host',
                'connection',
                'keep-alive',
                'proxy-authenticate',
                'proxy-authorization',
                'te',
                'trailers',
                'transfer-encoding',
                'upgrade',
            ].includes(lowerKey)
        ) {
            targetHeaders.set(key, value);
        }
    });

    // Add custom headers
    Object.entries(CUSTOM_HEADERS).forEach(([key, value]) => {
        targetHeaders.set(key, value as string);
    });

    // Set the host header to the target API
    const targetHost = new URL(TARGET_API_URL).host;
    targetHeaders.set('host', targetHost);
    targetHeaders.set('x-host', targetHost);

    // Ensure upstream returns identity encoding to avoid double decompression
    if (targetHeaders.has('accept-encoding')) {
        targetHeaders.delete('accept-encoding');
    }
    targetHeaders.set('accept-encoding', 'identity');

    // Body streaming: only for methods that can carry a body
    const method = incoming.method;
    let body: ReadableStream<Uint8Array> | null = null;
    if (incoming.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        body = incoming.body as ReadableStream<Uint8Array>;
    }

    const reqInit: RequestInit & { duplex?: 'half' } = {
        method,
        headers: targetHeaders,
        body,
        redirect: 'manual',
    };
    reqInit.duplex = 'half';

    const upstream = await fetch(targetUrl, reqInit);

    // Prepare response headers
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (
            !HIDDEN_RESPONSE_HEADERS.includes(lowerKey) &&
            ![
                'connection',
                'keep-alive',
                'transfer-encoding',
                'content-encoding',
                'content-length',
            ].includes(lowerKey)
        ) {
            responseHeaders.set(key, value);
        }
    });

    // Stream back the response as-is
    return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
    });
}

export const app = new Hono()
    .basePath('/api/p')
    // Catch-all handler for any path under /api/p
    .all('/*', async (c) => {
        try {
            // Strip our proxy base '/api/p' from the original pathname
            const { pathname } = new URL(c.req.url);
            const stripped = pathname.replace(/^\/api\/p\/?/, '');
            const slugPath = stripped.startsWith('/') ? stripped.slice(1) : stripped;
            return await proxyRequest(c.req.raw, slugPath);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return c.json({ error: 'Proxy request failed', details: message }, 500);
        }
    });

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const HEAD = handle(app);
export const OPTIONS = handle(app);
