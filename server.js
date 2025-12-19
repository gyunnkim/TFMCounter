const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 데이터 저장용 변수 (실제 운영에서는 데이터베이스 사용 권장)
let gameData = {
    players: [],
    games: [],
    lastUpdated: new Date().toISOString()
};

// 데이터 파일 경로
const DATA_FILE = path.join(__dirname, 'server-data.json');

// 서버 시작 시 데이터 로드
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            gameData = JSON.parse(data);
            console.log('기존 데이터를 로드했습니다.');
        }
    } catch (error) {
        console.error('데이터 로드 중 오류:', error);
    }
}

// 데이터 저장
function saveData() {
    try {
        gameData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(gameData, null, 2));
    } catch (error) {
        console.error('데이터 저장 중 오류:', error);
    }
}

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API 라우트
app.get('/api/data', (req, res) => {
    res.json(gameData);
});

app.post('/api/data', (req, res) => {
    gameData = { ...req.body, lastUpdated: new Date().toISOString() };
    saveData();
    
    // 모든 클라이언트에게 데이터 업데이트 알림
    io.emit('dataUpdate', gameData);
    
    res.json({ success: true, message: '데이터가 업데이트되었습니다.' });
});

// WebSocket 연결 처리
io.on('connection', (socket) => {
    console.log('클라이언트가 연결되었습니다:', socket.id);
    
    // 연결 시 현재 데이터 전송
    socket.emit('dataUpdate', gameData);
    
    // 데이터 업데이트 요청 처리
    socket.on('updateData', (data) => {
        gameData = { ...data, lastUpdated: new Date().toISOString() };
        saveData();
        
        // 다른 모든 클라이언트에게 업데이트 전송 (요청한 클라이언트 제외)
        socket.broadcast.emit('dataUpdate', gameData);
        
        console.log('데이터가 업데이트되었습니다.');
    });
    
    // 플레이어 설정 업데이트
    socket.on('updatePlayers', (players) => {
        gameData.players = players;
        gameData.lastUpdated = new Date().toISOString();
        saveData();
        socket.broadcast.emit('playersUpdate', players);
    });
    
    // 게임 추가
    socket.on('addGame', (game) => {
        gameData.games.push(game);
        gameData.lastUpdated = new Date().toISOString();
        saveData();
        socket.broadcast.emit('gameAdded', game);
    });
    
    // 게임 삭제
    socket.on('deleteGame', (gameId) => {
        gameData.games = gameData.games.filter(g => g.id !== gameId);
        gameData.lastUpdated = new Date().toISOString();
        saveData();
        socket.broadcast.emit('gameDeleted', gameId);
    });
    
    // 연결 해제
    socket.on('disconnect', () => {
        console.log('클라이언트가 연결 해제되었습니다:', socket.id);
    });
});

// 서버 시작
const PORT = process.env.PORT || 3000;

loadData();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 테라포밍 마스 서버가 시작되었습니다!`);
    console.log(`📱 로컬 접속: http://localhost:${PORT}`);
    console.log(`🌐 네트워크 접속: http://172.30.1.26:${PORT}`);
    console.log(`⚡ 실시간 동기화 활성화됨`);
});
