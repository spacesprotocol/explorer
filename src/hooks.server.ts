import type { Handle } from '@sveltejs/kit';
import { cacheGet, cacheSet } from '$lib/cache';

export const handle: Handle = async ({ event, resolve }) => {
    const startTime = Date.now();

    const getClientIP = (event: any): string => {
        const headers = event.request.headers;
        return headers.get('cf-connecting-ip') || // Cloudflare
               headers.get('x-real-ip') || // Nginx
               headers.get('x-client-ip') ||
               headers.get('x-forwarded-for')?.split(',')[0] ||
               event.getClientAddress?.() || // SvelteKit method
               'unknown';
    };

    const timeout = 3000;

    const clientIP = getClientIP(event);
    const userAgent = event.request.headers.get('user-agent') || 'unknown';

    if (event.url.pathname.startsWith('/api/')) {
        const isGet = event.request.method === 'GET';
        const cacheKey = event.url.pathname + event.url.search;

        // Cache lookup — skip DB entirely on hit
        if (isGet) {
            const cached = await cacheGet(cacheKey);
            if (cached) {
                const endTime = Date.now();
                console.log(`${new Date().toISOString()} IP: ${clientIP} | UA: ${userAgent} | ${event.url.pathname} | CACHE HIT ${endTime - startTime}ms`);
                return new Response(cached, {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
                });
            }
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        try {
            const response = await Promise.race([
                resolve(event),
                timeoutPromise
            ]) as Response;

            const endTime = Date.now();
            console.log(`${new Date().toISOString()} IP: ${clientIP} | UA: ${userAgent} | ${event.url.pathname} | Response Time: ${endTime - startTime}ms`);

            // Cache successful GET responses
            if (isGet && response.status === 200) {
                const body = await response.text();
                await cacheSet(cacheKey, body, event.url.pathname);
                return new Response(body, {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
                });
            }

            return response;
        } catch (error) {
            console.log(`${new Date().toISOString()} IP: ${clientIP} | UA: ${userAgent} | ${event.url.pathname} | TIMEOUT after ${timeout}ms`);

            return new Response(JSON.stringify({
                error: 'Request timed out',
                status: 504,
                path: event.url.pathname
            }), {
                status: 504,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    const response = await resolve(event);
    return response;
};
