import { createClient } from 'redis';

// Redis 클라이언트 생성 (Serverless 환경용 - 매 요청마다 새 연결)
const getRedisClient = async () => {
    const client = createClient({
        url: process.env.REDIS_URL,
        socket: {
            connectTimeout: 5000,
            reconnectStrategy: false
        }
    });
    
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    return client;
};

const LAST_UPDATED_KEY = 'terraforming_mars_last_updated';
const GAME_DATA_KEY = 'terraforming_mars_data';

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method === 'GET') {
        let client;
        try {
            client = await getRedisClient();
            const { timestamp } = req.query;
            const lastUpdated = await client.get(LAST_UPDATED_KEY);
            
            // 타임스탬프 비교하여 업데이트 필요 여부 확인
            const needsUpdate = !timestamp || timestamp !== lastUpdated;
            
            let data = null;
            if (needsUpdate) {
                const gameDataStr = await client.get(GAME_DATA_KEY);
                if (gameDataStr) {
                    data = JSON.parse(gameDataStr);
                    data.lastUpdated = lastUpdated;
                }
            }
            
            console.log(`동기화 체크: ${needsUpdate ? '업데이트 필요' : '최신 상태'} (클라이언트: ${timestamp}, 서버: ${lastUpdated})`);
            
            res.status(200).json({
                needsUpdate,
                data,
                lastUpdated
            });
        } catch (error) {
            console.error('동기화 체크 오류:', error);
            res.status(500).json({
                success: false,
                message: '동기화 체크 중 오류가 발생했습니다.',
                error: error.message
            });
        } finally {
            if (client) {
                await client.quit().catch(() => {});
            }
        }
    } else {
        res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
        });
    }
}
