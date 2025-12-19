// 기존 데이터를 Vercel KV로 마이그레이션하는 스크립트
// 로컬에서 한 번만 실행하면 됩니다.

const fs = require('fs');
const path = require('path');

async function migrateData() {
    try {
        // 기존 데이터 파일 읽기
        const dataPath = path.join(__dirname, 'data', 'game_data.json');
        
        if (fs.existsSync(dataPath)) {
            const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            
            console.log('기존 데이터 발견:');
            console.log(`- 플레이어: ${existingData.players?.length || 0}명`);
            console.log(`- 게임: ${existingData.games?.length || 0}개`);
            
            // Vercel 배포 후 API 엔드포인트로 데이터 전송
            const response = await fetch('https://your-app.vercel.app/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(existingData)
            });
            
            if (response.ok) {
                console.log('✅ 데이터 마이그레이션 완료!');
            } else {
                console.error('❌ 마이그레이션 실패:', await response.text());
            }
        } else {
            console.log('기존 데이터 파일이 없습니다. 새로 시작합니다.');
        }
    } catch (error) {
        console.error('마이그레이션 오류:', error);
    }
}

// 사용법: 
// 1. Vercel 배포 완료 후
// 2. 위 URL을 실제 배포된 도메인으로 변경
// 3. node migrate-data.js 실행

console.log('데이터 마이그레이션 스크립트');
console.log('배포 완료 후 실행하세요.');
// migrateData(); // 주석 해제하여 실행
