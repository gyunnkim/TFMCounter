import { getDataStore, getStoreDiagnostics, parseStoredJson } from '../lib/dataStore.js';

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
        let store;
        try {
            store = await getDataStore();
            const { timestamp } = req.query;
            const lastUpdated = await store.get(LAST_UPDATED_KEY);
            
            // 타임스탬프 비교하여 업데이트 필요 여부 확인
            const needsUpdate = !timestamp || timestamp !== lastUpdated;
            
            let data = null;
            if (needsUpdate) {
                const storedData = await store.get(GAME_DATA_KEY);
                if (storedData) {
                    data = parseStoredJson(storedData);
                    if (data) {
                        data.lastUpdated = lastUpdated;
                    }
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
                error: error.message,
                code: error.code,
                store: getStoreDiagnostics()
            });
        } finally {
            if (store) {
                await store.close();
            }
        }
    } else {
        res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
        });
    }
}
