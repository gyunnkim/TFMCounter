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

const GAME_DATA_KEY = 'terraforming_mars_data';

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method === 'GET') {
        let client;
        try {
            client = await getRedisClient();
            const gameDataStr = await client.get(GAME_DATA_KEY);
            const gameData = gameDataStr ? JSON.parse(gameDataStr) : { players: [], games: [] };
            
            // 내보내기용 데이터 생성
            const exportData = {
                ...gameData,
                exportDate: new Date().toISOString(),
                exportedBy: 'TFM Counter Web App'
            };
            
            // JSON 파일로 다운로드
            const filename = `tfm_data_${new Date().toISOString().split('T')[0]}.json`;
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(200).json(exportData);
            
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({
                success: false,
                message: '데이터 내보내기 중 오류가 발생했습니다.'
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
