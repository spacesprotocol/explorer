import Redis from 'ioredis';
import { env } from '$env/dynamic/private';

// TTL in seconds by route pattern
const TTL_MAP: Array<[RegExp, number]> = [
    [/^\/api\/(block\/[^/]+\/(header|txs)|transactions\/)/, 300], // immutable confirmed data
    [/^\/api\/(stats|auctions\/|space\/|actions\/)/, 15],          // live protocol data
    [/^\/api\/search/, 10],
];

function getTTL(pathname: string): number {
    for (const [pattern, ttl] of TTL_MAP) {
        if (pattern.test(pathname)) return ttl;
    }
    return 10;
}

let _redis: Redis | null = null;

function getRedis(): Redis | null {
    if (!env.REDIS_URL) return null;
    if (_redis) return _redis;

    _redis = new Redis(env.REDIS_URL, {
        tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 2000,
        commandTimeout: 1000,
        maxRetriesPerRequest: 1,
    });

    _redis.on('error', (err) => {
        console.warn('Redis error (non-fatal):', err.message);
    });

    return _redis;
}

export async function cacheGet(key: string): Promise<string | null> {
    try {
        return await getRedis()?.get(key) ?? null;
    } catch {
        return null; // fail open
    }
}

export async function cacheSet(key: string, value: string, pathname: string): Promise<void> {
    try {
        const ttl = getTTL(pathname);
        await getRedis()?.set(key, value, 'EX', ttl);
    } catch {
        // fail open
    }
}
