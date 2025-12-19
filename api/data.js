import { createClient } from 'redis';

// Redis 클라이언트 생성
let redis;
const getRedisClient = async () => {
    if (!redis) {
        redis = createClient({
            url: process.env.REDIS_URL
        });
        
        redis.on('error', (err) => console.log('Redis Client Error', err));
        await redis.connect();
    }
    return redis;
};

// 데이터 키 상수
const GAME_DATA_KEY = 'terraforming_mars_data';
const LAST_UPDATED_KEY = 'terraforming_mars_last_updated';

// 기본 데이터 구조
const defaultGameData = {
    players: [],
    games: [],
    selectedMap: 'THARSIS',
    selectedColonies: []
};

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const client = await getRedisClient();
        
        if (req.method === 'GET') {
            // 데이터 조회
            const gameDataStr = await client.get(GAME_DATA_KEY);
            const gameData = gameDataStr ? JSON.parse(gameDataStr) : defaultGameData;
            const lastUpdated = await client.get(LAST_UPDATED_KEY) || new Date().toISOString();
            
            console.log(`데이터 조회: ${gameData.players?.length || 0}명 플레이어, ${gameData.games?.length || 0}개 게임`);
            
            res.status(200).json({
                ...gameData,
                lastUpdated
            });
            
        } else if (req.method === 'POST') {
            // 데이터 업데이트
            const newData = req.body;
            const timestamp = new Date().toISOString();
            
            // 데이터 검증
            if (!newData.players || !Array.isArray(newData.players)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 플레이어 데이터입니다.'
                });
            }
            
            if (!newData.games || !Array.isArray(newData.games)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 게임 데이터입니다.'
                });
            }
            
            // Redis에 데이터 저장
            let normalizedSelectedMap = newData.selectedMap;
            // 과거/클라이언트 호환: 객체({value,name,...})면 value만 저장
            if (normalizedSelectedMap && typeof normalizedSelectedMap === 'object' && 'value' in normalizedSelectedMap) {
                normalizedSelectedMap = normalizedSelectedMap.value;
            }

            const dataToSave = {
                players: newData.players,
                games: newData.games,
                // ''(빈 문자열)도 유효한 "선택 안 함" 상태로 취급
                selectedMap: (normalizedSelectedMap === undefined || normalizedSelectedMap === null) ? 'THARSIS' : normalizedSelectedMap,
                selectedColonies: Array.isArray(newData.selectedColonies) ? newData.selectedColonies : []
            };
            
            await client.set(GAME_DATA_KEY, JSON.stringify(dataToSave));
            await client.set(LAST_UPDATED_KEY, timestamp);
            
            console.log(`데이터 저장 완료: ${newData.players.length}명 플레이어, ${newData.games.length}개 게임`);
            
            res.status(200).json({
                success: true,
                message: '데이터가 성공적으로 저장되었습니다.',
                lastUpdated: timestamp,
                stats: {
                    players: newData.players.length,
                    games: newData.games.length
                }
            });
            
        } else {
            res.status(405).json({ 
                success: false,
                message: 'Method not allowed' 
            });
        }
        
    } catch (error) {
        console.error('데이터베이스 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}
