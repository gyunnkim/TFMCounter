import { createClient as createRedisClient } from 'redis';

const getRedisUrl = () => process.env.REDIS_URL || process.env.KV_URL;
const hasRedisUrl = () => Boolean(getRedisUrl());
const hasVercelKvRest = () => Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export const getStoreDiagnostics = () => ({
    hasRedisUrl: hasRedisUrl(),
    hasKvUrl: Boolean(process.env.KV_URL),
    hasKvRestApiUrl: Boolean(process.env.KV_REST_API_URL),
    hasKvRestApiToken: Boolean(process.env.KV_REST_API_TOKEN)
});

export const parseStoredJson = (value, fallback = null) => {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    return value;
};

export const getDataStore = async () => {
    if (hasRedisUrl()) {
        const client = createRedisClient({
            url: getRedisUrl(),
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: false
            }
        });

        client.on('error', (err) => console.log('Redis Client Error', err));
        await client.connect();

        return {
            provider: 'redis-url',
            get: (key) => client.get(key),
            set: (key, value) => client.set(key, value),
            close: () => client.quit().catch(() => {})
        };
    }

    if (hasVercelKvRest()) {
        const { kv } = await import('@vercel/kv');

        return {
            provider: 'vercel-kv-rest',
            get: (key) => kv.get(key),
            set: (key, value) => kv.set(key, value),
            close: async () => {}
        };
    }

    const error = new Error('Redis 연결 정보가 없습니다. REDIS_URL, KV_URL 또는 KV_REST_API_URL/KV_REST_API_TOKEN 환경변수를 설정하세요.');
    error.code = 'MISSING_REDIS_ENV';
    throw error;
};
