// 실시간 동기화 관리 기능
TerraformingMarsTracker.prototype.initializeSync = function() {
    // 현재 호스트에 따라 서버 URL 결정
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // 로컬 개발 환경
        this.syncServerUrl = `http://localhost:${currentPort || '3000'}`;
    } else if (currentHost.includes('vercel.app')) {
        // Vercel 배포 환경 - HTTPS 사용, 포트 없음
        this.syncServerUrl = `https://${currentHost}`;
    } else {
        // 기타 환경
        this.syncServerUrl = `${window.location.protocol}//${currentHost}${currentPort ? ':' + currentPort : ''}`;
    }
    console.log('동기화 서버 URL:', this.syncServerUrl);
    this.lastSyncTimestamp = null;
    this.syncInterval = null;
    
    // 연결 상태 표시 (제거됨)
    
    // 서버에서 초기 데이터 로드
    this.loadFromServer();
    
    // 주기적 동기화 시작 (3초마다)
    this.startPeriodicSync();
};

// 동기화 상태 표시기 생성
TerraformingMarsTracker.prototype.createSyncIndicator = function() {
    const indicator = document.createElement('div');
    indicator.id = 'sync-indicator';
    indicator.innerHTML = `
        <div class="sync-status">
            <span class="sync-dot"></span>
            <span class="sync-text">연결 중...</span>
        </div>
    `;
    document.body.appendChild(indicator);
    
    // CSS 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        #sync-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 8px 12px;
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 8000;
            font-size: 0.8rem;
        }
        
        .sync-status {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .sync-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #fbbf24;
            animation: pulse 2s infinite;
        }
        
        .sync-dot.connected {
            background: #10b981;
            animation: none;
        }
        
        .sync-dot.disconnected {
            background: #ef4444;
            animation: none;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
};

// 동기화 상태 업데이트
TerraformingMarsTracker.prototype.updateSyncIndicator = function(connected) {
    const dot = document.querySelector('.sync-dot');
    const text = document.querySelector('.sync-text');
    
    if (connected) {
        dot.className = 'sync-dot connected';
        text.textContent = '실시간 동기화';
    } else {
        dot.className = 'sync-dot disconnected';
        text.textContent = '연결 끊김';
    }
};

// 서버 데이터 업데이트 처리
TerraformingMarsTracker.prototype.handleServerDataUpdate = function(data) {
    console.log('서버 데이터 업데이트 처리:', data);
    
    if (data.players !== undefined && data.games !== undefined) {
        const oldPlayersLength = this.players.length;
        const oldGamesLength = this.games.length;
        
        this.players = data.players;
        this.games = data.games;
        this.lastSyncTimestamp = data.lastUpdated;
        
        // 선택된 맵 복원 (''도 유효한 "선택 안 함" 상태)
        if (data.selectedMap !== undefined && data.selectedMap !== null) {
            let normalizedSelectedMap = data.selectedMap;
            // 과거 데이터 호환: 객체({value,name,...})로 저장된 경우 value만 사용
            if (normalizedSelectedMap && typeof normalizedSelectedMap === 'object' && 'value' in normalizedSelectedMap) {
                normalizedSelectedMap = normalizedSelectedMap.value;
            }

            this.selectedMap = normalizedSelectedMap;
            const mapSelect = document.getElementById('mapSelect');
            if (mapSelect && mapSelect.value !== normalizedSelectedMap) {
                mapSelect.value = normalizedSelectedMap;
            }

            if (normalizedSelectedMap === '') {
                const selectedMapName = document.getElementById('selectedMapName');
                if (selectedMapName) {
                    selectedMapName.textContent = '맵을 선택해주세요';
                    selectedMapName.classList.remove('selected');
                }
            } else {
                // 맵 표시도 업데이트
                if (typeof this.updateSelectedMapDisplay === 'function') {
                    this.updateSelectedMapDisplay(normalizedSelectedMap);
                }
            }

            console.log('맵 선택 복원:', normalizedSelectedMap);
        }

        // 선택된 개척기지 복원 (누락되면 빈 배열로 간주해서 기존 표시가 남지 않게 함)
        this.selectedColonies = Array.isArray(data.selectedColonies) ? data.selectedColonies : [];
        if (typeof this.displayColoniesInPage === 'function') {
            this.displayColoniesInPage(this.selectedColonies);
        }
        
        console.log(`플레이어: ${oldPlayersLength} -> ${this.players.length}, 게임: ${oldGamesLength} -> ${this.games.length}`);
        
        // 통계 재계산
        if (this.games.length > 0) {
            this.recalculateAllStats();
            console.log('통계 재계산 완료 - 플레이어 평균점수 확인:');
            this.players.forEach(player => {
                console.log(`${player.name}: ${player.stats.averageScore}점 (${player.stats.totalScore}/${player.stats.totalGames})`);
            });
        }
        
        // UI 업데이트
        if (this.players.length > 0) {
            document.getElementById('player-setup').classList.add('hidden');
            document.getElementById('game-input').classList.remove('hidden');
            // generateGameInputs 호출 전에 잠시 대기
            setTimeout(() => {
                this.generateGameInputs();
                
                // 플레이어 순서가 있으면 UI 업데이트
                const hasOrder = this.players.some(player => player.playOrder);
                if (hasOrder) {
                    console.log('플레이어 순서 복원 중...');
                    // 순서 정하기 버튼 텍스트 업데이트
                    const orderButton = document.getElementById('randomizeOrder');
                    if (orderButton) {
                        orderButton.textContent = '🔄 순서 다시 정하기';
                    }
                    // 순서 표시 업데이트
                    setTimeout(() => {
                        this.updateGameInputsWithOrder();
                    }, 200);
                    
                    // 플레이어가 순서대로 정렬되어 있는지 확인
                    const isOrderedCorrectly = this.checkPlayerOrderArrangement();
                    if (!isOrderedCorrectly) {
                        console.log('플레이어 순서 재배치 필요');
                    }
                }
            }, 100);
        } else {
            document.getElementById('player-setup').classList.remove('hidden');
            document.getElementById('game-input').classList.add('hidden');
        }
        
        this.updateRanking();
        this.updateHistory();
        
        // 로컬 스토리지도 업데이트
        this.saveData();
        
        console.log('서버 데이터 업데이트 완료');
    } else {
        console.log('서버 데이터가 유효하지 않음:', data);
    }
};

// 모든 통계 재계산
TerraformingMarsTracker.prototype.recalculateAllStats = function() {
    // 플레이어 통계 초기화
    this.players.forEach(player => {
        player.games = [];
        player.stats = {
            totalGames: 0,
            totalScore: 0,
            averageScore: 0,
            wins: 0,
            seconds: 0,
            thirds: 0,
            fourths: 0
        };
    });
    
    // 게임 데이터로부터 통계 재계산 (이름으로 매칭)
    this.games.forEach(game => {
        game.results.forEach(result => {
            const player = this.players.find(p => p.name === result.playerName);
            if (player) {
                player.games.push(result);
                player.stats.totalGames++;
                player.stats.totalScore += result.score;
                
                // 순위별 카운트
                switch (result.rank) {
                    case 1: player.stats.wins++; break;
                    case 2: player.stats.seconds++; break;
                    case 3: player.stats.thirds++; break;
                    case 4: player.stats.fourths++; break;
                }
            }
        });
    });
    
    // 평균점수 계산
    this.players.forEach(player => {
        if (player.stats.totalGames > 0) {
            player.stats.averageScore = Math.round(player.stats.totalScore / player.stats.totalGames * 10) / 10;
        }
    });
};

// 플레이어 순서 배치 확인
TerraformingMarsTracker.prototype.checkPlayerOrderArrangement = function() {
    const playersWithOrder = this.players.filter(player => player.playOrder);
    if (playersWithOrder.length === 0) return true;
    
    // 순서대로 정렬된 상태인지 확인
    for (let i = 0; i < playersWithOrder.length; i++) {
        if (playersWithOrder[i].id !== i + 1 || playersWithOrder[i].playOrder !== i + 1) {
            return false;
        }
    }
    return true;
};

// 게임 데이터로부터 플레이어 통계 업데이트
TerraformingMarsTracker.prototype.updatePlayerStatsFromGames = function() {
    this.recalculateAllStats();
};

// 서버에서 데이터 로드
TerraformingMarsTracker.prototype.loadFromServer = function() {
    console.log('서버에서 데이터 로드 시도:', this.syncServerUrl);
    fetch(`${this.syncServerUrl}/api/data`)
        .then(response => {
            console.log('서버 응답 상태:', response.status);
            if (!response.ok) {
                return response.json().catch(() => ({})).then(errorBody => {
                    throw new Error(errorBody.message || `서버 응답 오류: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('서버에서 데이터 로드 성공:', data);
            // 서버에 유효한 데이터가 있으면 플래그 설정
            if (data.players && data.players.length > 0) {
                this.serverDataLoaded = true;
            }
            this.handleServerDataUpdate(data);
            this.updateSyncIndicator(true);
        })
        .catch(error => {
            console.error('서버 데이터 로드 실패:', error);
            this.updateSyncIndicator(false);
            // 서버 실패 시 로컬 데이터 로드
            this.loadData();
        });
};

// 주기적 동기화 시작
TerraformingMarsTracker.prototype.startPeriodicSync = function() {
    this.syncInterval = setInterval(() => {
        this.checkForUpdates();
    }, 3000); // 3초마다 체크
};

// 업데이트 확인
TerraformingMarsTracker.prototype.checkForUpdates = function() {
    // 서버로 데이터 전송 중이면 동기화 체크 건너뛰기
    if (this.isSyncingToServer) {
        console.log('서버 전송 중, 동기화 체크 건너뜀');
        return;
    }
    
    const url = `${this.syncServerUrl}/api/sync?timestamp=${encodeURIComponent(this.lastSyncTimestamp || '')}`;
    
    console.log('업데이트 확인:', url, '현재 타임스탬프:', this.lastSyncTimestamp);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().catch(() => ({})).then(errorBody => {
                    throw new Error(errorBody.message || `서버 응답 오류: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(result => {
            console.log('동기화 체크 결과:', result);
            if (result.needsUpdate && result.data) {
                console.log('서버에서 업데이트 감지, 데이터 적용:', result.data);
                this.handleServerDataUpdate(result.data);
            } else {
                console.log('업데이트 없음');
            }
            this.updateSyncIndicator(true);
        })
        .catch(error => {
            console.error('동기화 체크 실패:', error);
            this.updateSyncIndicator(false);
        });
};

// 디버깅용 함수 - 콘솔에서 호출 가능
TerraformingMarsTracker.prototype.debugPlayerStats = function() {
    console.log('=== 플레이어 통계 디버깅 ===');
    this.players.forEach(player => {
        console.log(`${player.name}:`, {
            totalGames: player.stats.totalGames,
            totalScore: player.stats.totalScore,
            averageScore: player.stats.averageScore,
            wins: player.stats.wins,
            seconds: player.stats.seconds,
            thirds: player.stats.thirds
        });
    });
    console.log('총 게임 수:', this.games.length);
};

// 서버로 데이터 전송
TerraformingMarsTracker.prototype.syncToServer = function(type, data) {
    // 서버 전송 중 플래그 설정 (동기화 체크 방지)
    this.isSyncingToServer = true;
    
    let normalizedSelectedMap = this.selectedMap;
    // 객체로 들어온 경우 문자열로 정규화
    if (normalizedSelectedMap && typeof normalizedSelectedMap === 'object' && 'value' in normalizedSelectedMap) {
        normalizedSelectedMap = normalizedSelectedMap.value;
    }

    const fullData = {
        players: this.players,
        games: this.games,
        // ''(빈 문자열)도 유효한 "초기화 상태"로 취급해야 하므로 || 를 쓰면 안 됨
        selectedMap: (normalizedSelectedMap === undefined || normalizedSelectedMap === null) ? 'THARSIS' : normalizedSelectedMap, // 기본값 설정
        selectedColonies: Array.isArray(this.selectedColonies) ? this.selectedColonies : []
    };
    
    console.log('서버로 데이터 전송:', type, fullData);
    
    fetch(`${this.syncServerUrl}/api/data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullData)
    })
    .then(response => {
        console.log('서버 응답 상태:', response.status);
        if (!response.ok) {
            return response.json().catch(() => ({})).then(errorBody => {
                throw new Error(errorBody.message || `서버 응답 오류: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(result => {
        console.log('서버로 데이터 동기화 완료:', result);
        this.updateSyncIndicator(true);
        
        // 동기화 후 타임스탬프 업데이트
        if (result.lastUpdated) {
            this.lastSyncTimestamp = result.lastUpdated;
        }
        
        // 전송 완료 후 플래그 해제
        this.isSyncingToServer = false;
    })
    .catch(error => {
        console.error('서버 동기화 실패:', error);
        this.updateSyncIndicator(false);
        this.isSyncingToServer = false;
    });
};
