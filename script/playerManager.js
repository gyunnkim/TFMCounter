// 플레이어 관리 기능
TerraformingMarsTracker.prototype.generatePlayerInputs = function() {
    const container = document.getElementById('players-container');
    container.innerHTML = '';

    for (let i = 1; i <= this.currentPlayerCount; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-input';
        playerDiv.innerHTML = `
            <label for="player${i}Name">플레이어 ${i} 이름:</label>
            <input type="text" id="player${i}Name" placeholder="플레이어 이름 입력">
        `;
        container.appendChild(playerDiv);
    }
};

TerraformingMarsTracker.prototype.setupPlayers = function() {
    const players = [];
    let allValid = true;

    for (let i = 1; i <= this.currentPlayerCount; i++) {
        const name = document.getElementById(`player${i}Name`).value.trim();

        if (!name) {
            allValid = false;
            break;
        }

        players.push({
            id: i,
            name: name,
            selectedCube: '', // 선택된 큐브 색상 저장
            selectedCorporation: '', // 선택된 기업 저장
            games: [],
            stats: {
                totalGames: 0,
                totalScore: 0,
                averageScore: 0,
                wins: 0,
                seconds: 0,
                thirds: 0,
                fourths: 0
            }
        });
    }

    if (!allValid) {
        alert('모든 플레이어의 이름을 입력해주세요.');
        return;
    }

    this.players = players;
    this.generateGameInputs();
    document.getElementById('player-setup').classList.add('hidden');
    document.getElementById('game-input').classList.remove('hidden');
    this.updateRanking();
    // 서버로 플레이어 데이터 동기화
    this.syncToServer('players', this.players);
};

TerraformingMarsTracker.prototype.resetPlayers = function() {
    if (confirm('모든 플레이어 데이터와 게임 기록을 초기화하시겠습니까?')) {
        this.players = [];
        this.games = [];
        
        // 순서 초기화
        this.resetPlayerOrder();
        
        // UI 초기화
        document.getElementById('player-setup').classList.remove('hidden');
        document.getElementById('game-input').classList.add('hidden');
        
        // 플레이어 입력 필드 초기화
        this.generatePlayerInputs();
        
        // 랭킹 및 히스토리 업데이트
        this.updateRanking();
        this.updateHistory();
        
        // 데이터 저장
        this.saveData();
        
        // 서버 동기화
        this.syncToServer('resetPlayers', {});
        
        alert('플레이어 데이터가 초기화되었습니다.');
    }
};
