import { kv } from '@vercel/kv';

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
        try {
            const { timestamp } = req.query;
            const lastUpdated = await kv.get(LAST_UPDATED_KEY);
            
            // 타임스탬프 비교하여 업데이트 필요 여부 확인
            const needsUpdate = !timestamp || timestamp !== lastUpdated;
            
            let data = null;
            if (needsUpdate) {
                const gameData = await kv.get(GAME_DATA_KEY);
                if (gameData) {
                    data = gameData;
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
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    } else {
        res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
        });
    }
}
