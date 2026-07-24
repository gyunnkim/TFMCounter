import { getDataStore, getStoreDiagnostics } from '../lib/dataStore.js';

const KEEPALIVE_KEY = 'terraforming_mars_keepalive';

const isAuthorizedCronRequest = (req) => {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        return process.env.VERCEL_ENV !== 'production';
    }

    return req.headers.authorization === `Bearer ${cronSecret}`;
};

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    if (!isAuthorizedCronRequest(req)) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    let store;
    try {
        store = await getDataStore();

        const checkedAt = new Date().toISOString();
        const keepaliveData = {
            checkedAt,
            source: 'vercel-cron'
        };

        await store.set(KEEPALIVE_KEY, JSON.stringify(keepaliveData));
        const storedValue = await store.get(KEEPALIVE_KEY);

        res.status(200).json({
            success: true,
            checkedAt,
            stored: Boolean(storedValue),
            store: getStoreDiagnostics()
        });
    } catch (error) {
        console.error('Redis keepalive 오류:', error);
        res.status(500).json({
            success: false,
            message: 'Redis keepalive 중 오류가 발생했습니다.',
            error: error.message,
            code: error.code,
            store: getStoreDiagnostics()
        });
    } finally {
        if (store) {
            await store.close();
        }
    }
}
