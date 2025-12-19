#!/bin/bash

# 테라포밍 마스 서버 재시작 스크립트

PORT=3010
SCRIPT_NAME="sync_server.py"

echo "🔄 테라포밍 마스 서버 재시작 중..."

# 1. 기존 프로세스 종료
echo "📝 기존 서버 프로세스 종료 중..."
pkill -f "$SCRIPT_NAME" 2>/dev/null
lsof -ti:$PORT | xargs kill -9 2>/dev/null

# 2. 잠시 대기 (포트 해제 시간)
echo "⏳ 포트 해제 대기 중... (2초)"
sleep 2

# 3. 새 서버 시작
echo "🚀 새 서버 시작 중..."
python3 "$SCRIPT_NAME" &

# 4. 서버 시작 확인
echo "⏳ 서버 시작 확인 중... (3초)"
sleep 3

# 5. 서버 상태 확인
if lsof -i:$PORT >/dev/null 2>&1; then
    echo "✅ 서버가 성공적으로 시작되었습니다!"
    echo "📱 로컬 접속: http://localhost:$PORT"
    echo "🌐 네트워크 접속: http://172.30.1.30:$PORT"
    echo "💡 서버 로그 확인: tail -f nohup.out"
else
    echo "❌ 서버 시작에 실패했습니다."
    echo "🔧 수동으로 다시 시도해주세요: python3 $SCRIPT_NAME"
fi
