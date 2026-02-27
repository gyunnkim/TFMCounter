// 레거시 데이터 관리 기능 (클라이언트 사이드 다운로드)
TerraformingMarsTracker.prototype.exportData = function() {
    if (this.games.length === 0) {
        alert('저장할 게임 데이터가 없습니다.');
        return;
    }

    try {
        // 내보내기용 데이터 생성
        const exportData = {
            players: this.players,
            games: this.games,
            selectedMap: this.selectedMap || 'THARSIS',
            exportDate: new Date().toISOString(),
            exportedBy: 'TFM Counter Web App',
            version: '2.0'
        };

        // JSON 파일로 다운로드
        const filename = `tfm_data_${new Date().toISOString().split('T')[0]}.json`;
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`✅ 데이터 내보내기 완료!\n\n파일명: ${filename}\n게임 수: ${this.games.length}게임\n플레이어 수: ${this.players.length}명`);
        
        // 데이터 내보내기 후 현재 데이터 초기화 여부 확인
        if (confirm('데이터를 다운로드했습니다. 현재 게임 데이터를 초기화하시겠습니까?')) {
            this.clearCurrentData();
            alert('현재 데이터가 초기화되었습니다. 새로운 게임을 시작할 수 있습니다.');
        }
        
    } catch (error) {
        console.error('데이터 내보내기 오류:', error);
        alert(`❌ 데이터 내보내기 중 오류가 발생했습니다: ${error.message}`);
    }
};

TerraformingMarsTracker.prototype.importData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // 레거시 데이터 형식 확인
            if (data.players && data.games) {
                const gameCount = data.games.length;
                const playerCount = data.players.length;
                const exportDate = data.exportDate ? new Date(data.exportDate).toLocaleDateString() : '알 수 없음';
                
                const message = `레거시 데이터 정보:
- 플레이어 수: ${playerCount}명
- 게임 수: ${gameCount}게임
- 저장 날짜: ${exportDate}

현재 데이터와 병합하시겠습니까?`;
                
                if (confirm(message)) {
                    // 기존 데이터와 병합
                    this.mergeLegacyData(data);
                    alert('레거시 데이터를 성공적으로 불러왔습니다!');
                }
            } else {
                alert('올바르지 않은 레거시 데이터 형식입니다.');
            }
        } catch (error) {
            alert('레거시 파일을 읽는 중 오류가 발생했습니다.');
        }
    };
    reader.readAsText(file);
    
    // 파일 입력 초기화
    event.target.value = '';
};

TerraformingMarsTracker.prototype.saveData = function() {
    const data = {
        players: this.players,
        games: this.games
    };
    localStorage.setItem('terraformingMarsData', JSON.stringify(data));
};

TerraformingMarsTracker.prototype.loadData = function() {
    // 서버에서 데이터를 이미 로드했으면 로컬 데이터 무시
    if (this.serverDataLoaded) {
        console.log('서버 데이터가 이미 로드됨, 로컬 데이터 로드 건너뜀');
        return;
    }
    
    const savedData = localStorage.getItem('terraformingMarsData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            this.players = data.players || [];
            this.games = data.games || [];
            
            console.log(`로컬 데이터 로드: ${this.players.length}명 플레이어, ${this.games.length}게임`);
            
            if (this.players.length > 0) {
                document.getElementById('player-setup').classList.add('hidden');
                document.getElementById('game-input').classList.remove('hidden');
                // generateGameInputs 호출 전에 잠시 대기
                setTimeout(() => {
                    this.generateGameInputs();
                }, 100);
            }
            
            this.updateRanking();
            this.updateHistory();
        } catch (error) {
            console.error('데이터 로드 중 오류:', error);
        }
    }
};

// 현재 데이터 초기화
TerraformingMarsTracker.prototype.clearCurrentData = function() {
    this.players = [];
    this.games = [];
    
    // UI 초기화
    document.getElementById('player-setup').classList.remove('hidden');
    document.getElementById('game-input').classList.add('hidden');
    
    // 로컬 스토리지 초기화
    this.saveData();
    
    // 서버 동기화 (빈 데이터로)
    if (this.syncToServer) {
        this.syncToServer('clearData', {});
    }
    
    // UI 업데이트
    this.updateRanking();
    this.updateHistory();
};

// 레거시 데이터 병합
TerraformingMarsTracker.prototype.mergeLegacyData = function(legacyData) {
    // 플레이어 데이터 병합 (중복 방지)
    const existingPlayerNames = this.players.map(p => p.name);
    const newPlayers = legacyData.players.filter(p => !existingPlayerNames.includes(p.name));
    
    // 새로운 플레이어들의 ID 재할당
    let maxId = this.players.length > 0 ? Math.max(...this.players.map(p => p.id)) : 0;
    newPlayers.forEach(player => {
        player.id = ++maxId;
    });
    
    this.players = [...this.players, ...newPlayers];
    
    // 게임 데이터 병합 (ID 재할당)
    let maxGameId = this.games.length > 0 ? Math.max(...this.games.map(g => g.id)) : 0;
    const newGames = legacyData.games.map(game => ({
        ...game,
        id: ++maxGameId
    }));
    
    this.games = [...this.games, ...newGames];
    
    // 플레이어 통계 재계산
    this.recalculateAllStats();
    
    // UI 업데이트
    if (this.players.length > 0) {
        document.getElementById('player-setup').classList.add('hidden');
        document.getElementById('game-input').classList.remove('hidden');
        setTimeout(() => {
            this.generateGameInputs();
        }, 100);
    }
    
    this.updateRanking();
    this.updateHistory();
    this.saveData();
    
    // 서버 동기화 (완료 대기)
    if (this.syncToServer) {
        this.syncToServerAndWait('mergeLegacy');
    }
};

// 서버 동기화 완료 대기 (데이터 불러오기용)
TerraformingMarsTracker.prototype.syncToServerAndWait = function(type) {
    // 로딩 표시
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'sync-loading';
    loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
                <div>서버에 데이터 저장 중...</div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    // 서버 전송 중 플래그 설정
    this.isSyncingToServer = true;
    
    let normalizedSelectedMap = this.selectedMap;
    if (normalizedSelectedMap && typeof normalizedSelectedMap === 'object' && 'value' in normalizedSelectedMap) {
        normalizedSelectedMap = normalizedSelectedMap.value;
    }

    const fullData = {
        players: this.players,
        games: this.games,
        selectedMap: (normalizedSelectedMap === undefined || normalizedSelectedMap === null) ? 'THARSIS' : normalizedSelectedMap,
        selectedColonies: Array.isArray(this.selectedColonies) ? this.selectedColonies : []
    };
    
    console.log('서버로 데이터 전송 (대기):', type, fullData);
    
    fetch(`${this.syncServerUrl}/api/data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('서버 동기화 완료:', result);
        
        if (result.lastUpdated) {
            this.lastSyncTimestamp = result.lastUpdated;
        }
        
        this.isSyncingToServer = false;
        
        // 로딩 제거
        const loading = document.getElementById('sync-loading');
        if (loading) loading.remove();
        
        alert(`✅ 데이터가 서버에 저장되었습니다!\n\n플레이어: ${this.players.length}명\n게임: ${this.games.length}게임`);
    })
    .catch(error => {
        console.error('서버 동기화 실패:', error);
        this.isSyncingToServer = false;
        
        // 로딩 제거
        const loading = document.getElementById('sync-loading');
        if (loading) loading.remove();
        
        alert('⚠️ 서버 저장에 실패했습니다. 로컬에만 저장되었습니다.');
    });
};
