// 게임 관리 기능
TerraformingMarsTracker.prototype.generateGameInputs = function() {
    const container = document.getElementById('game-scores-container');
    container.innerHTML = '';

    this.players.forEach((player, index) => {
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-input';
        
        // 큐브 색상 옵션
        const cubeColors = [
            { value: 'red', name: '빨강', icon: 'red-square.svg' },
            { value: 'blue', name: '파랑', icon: 'blue-square.svg' },
            { value: 'green', name: '초록', icon: 'green-square.svg' },
            { value: 'yellow', name: '노랑', icon: 'yellow-square.svg' },
            { value: 'black', name: '검정', icon: 'black-square.svg' }
        ];
        const savedCube = player.selectedCube || 'black';
        const cubeIconSrc = `img/${savedCube}-square.svg`;

        scoreDiv.innerHTML = `
            <div class="player-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                <div class="cube-selector" id="cubeSelector${player.id}">
                    <img id="cubeIcon${player.id}" src="${cubeIconSrc}" alt="큐브" class="cube-icon clickable" style="width: 32px; height: 32px; cursor: pointer;">
                    <div id="cubeDropdown${player.id}" class="cube-dropdown" style="display: none;">
                        ${cubeColors.map(cube => `
                            <div class="cube-option" data-value="${cube.value}" data-icon="${cube.icon}">
                                <img src="img/${cube.icon}" alt="${cube.name}" style="width: 24px; height: 24px;">
                                <span>${cube.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="player-info" style="flex: 1;">
                    <label class="player-name-label" style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${player.name}</label>
                </div>
            </div>
            <select id="corp${player.id}" class="corp-select" style="margin-bottom: 10px; padding: 8px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; width: 100%;">
                <option value="">기업 선택</option>
            </select>
            <div class="score-breakdown" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                <input type="number" id="tr${player.id}" placeholder="TR" min="0" max="63" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
                <input type="number" id="awards${player.id}" placeholder="업적" min="0" max="15" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
                <input type="number" id="milestones${player.id}" placeholder="기업상" min="0" max="15" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
                <input type="number" id="druid${player.id}" placeholder="드루이드" min="0" max="20" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
                <input type="number" id="forest${player.id}" placeholder="숲" min="0" max="20" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
                <input type="number" id="city${player.id}" placeholder="도시" min="0" max="30" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
                <input type="number" id="congress${player.id}" placeholder="의회" min="0" max="20" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
                <input type="number" id="cards${player.id}" placeholder="카드점수" min="0" max="50" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;">
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
                <input type="number" id="totalScore${player.id}" placeholder="총점" readonly style="padding: 8px; border: 2px solid #cbd5e0; border-radius: 6px; background-color: #f7fafc; font-weight: bold; flex: 1;">
                <input type="number" id="megacredits${player.id}" placeholder="메가크레딧" min="0" style="padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px; flex: 1;">
            </div>
        `;
        container.appendChild(scoreDiv);

        // 큐브 아이콘 클릭 이벤트 (드롭다운 토글)
        const cubeIcon = document.getElementById(`cubeIcon${player.id}`);
        const cubeDropdown = document.getElementById(`cubeDropdown${player.id}`);
        
        cubeIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            // 다른 드롭다운들 닫기
            this.closeAllCubeDropdowns();
            // 현재 드롭다운 토글
            const isVisible = cubeDropdown.style.display === 'block';
            
            if (isVisible) {
                cubeDropdown.style.display = 'none';
            } else {
                // 드롭다운을 body에 append하고 절대 위치로 설정
                this.showCubeDropdownAtPosition(cubeDropdown, cubeIcon, player.id);
            }
        });

        // 큐브 옵션 선택 이벤트
        const cubeOptions = cubeDropdown.querySelectorAll('.cube-option');
        cubeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const selectedValue = option.dataset.value;
                const selectedIcon = option.dataset.icon;
                
                // 플레이어의 큐브 선택 저장
                player.selectedCube = selectedValue;
                
                // 아이콘 업데이트
                cubeIcon.src = `img/${selectedIcon}`;
                
                // 드롭다운 닫기
                cubeDropdown.style.display = 'none';
                
                // 다른 플레이어들의 옵션 업데이트
                this.updateAllCubeDropdowns();
                
                // 서버로 플레이어 데이터 동기화
                this.syncToServer('updatePlayerCube', {
                    playerId: player.id,
                    selectedCube: selectedValue
                });
                
                // 로컬 스토리지도 업데이트
                this.saveData();
            });
        });

        // 기업 선택 이벤트 리스너
        const corpSelect = document.getElementById(`corp${player.id}`);
        corpSelect.addEventListener('change', () => {
            const selectedCorp = corpSelect.value;
            
            // 플레이어의 기업 선택 저장
            player.selectedCorporation = selectedCorp;
            
            this.updateAvailableOptions();
            
            // 서버로 플레이어 데이터 동기화
            this.syncToServer('updatePlayerCorporation', {
                playerId: player.id,
                selectedCorporation: selectedCorp
            });
            
            // 로컬 스토리지도 업데이트
            this.saveData();
        });

        // 점수 입력 필드들에 자동 계산 이벤트 리스너 추가
        const scoreFields = ['tr', 'awards', 'milestones', 'druid', 'forest', 'city', 'congress', 'cards'];
        scoreFields.forEach(field => {
            const input = document.getElementById(`${field}${player.id}`);
            input.addEventListener('input', () => {
                this.calculateTotalScore(player.id);
            });
        });
    });

    // 초기 기업 옵션 로드
    this.players.forEach(player => {
        const corpSelect = document.getElementById(`corp${player.id}`);
        this.corporations.forEach(corp => {
            const option = document.createElement('option');
            option.value = corp;
            option.textContent = corp;
            corpSelect.appendChild(option);
        });
        
        // 저장된 기업이 있으면 복원
        if (player.selectedCorporation) {
            corpSelect.value = player.selectedCorporation;
        }
    });
    
    // 초기 옵션 업데이트
    this.updateAvailableOptions();
    
    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', () => {
        this.closeAllCubeDropdowns();
    });
};

// 모든 큐브 드롭다운 닫기
TerraformingMarsTracker.prototype.closeAllCubeDropdowns = function() {
    this.players.forEach(player => {
        const dropdown = document.getElementById(`cubeDropdown${player.id}`);
        if (dropdown) {
            dropdown.style.display = 'none';
            // body에 있는 경우 원래 위치로 되돌리기
            if (dropdown.parentNode === document.body) {
                const cubeSelector = document.getElementById(`cubeSelector${player.id}`);
                if (cubeSelector) {
                    cubeSelector.appendChild(dropdown);
                    dropdown.style.position = 'absolute';
                    dropdown.style.top = '100%';
                    dropdown.style.left = '0';
                }
            }
        }
    });
};

// 특정 플레이어의 큐브 드롭다운 옵션 업데이트
TerraformingMarsTracker.prototype.updateCubeDropdownOptions = function(playerId) {
    const dropdown = document.getElementById(`cubeDropdown${playerId}`);
    if (!dropdown) return;
    
    const selectedCubes = this.players
        .filter(p => p.id !== playerId && p.selectedCube)
        .map(p => p.selectedCube);
    
    const cubeOptions = dropdown.querySelectorAll('.cube-option');
    cubeOptions.forEach(option => {
        const cubeValue = option.dataset.value;
        if (selectedCubes.includes(cubeValue)) {
            option.style.opacity = '0.3';
            option.style.pointerEvents = 'none';
        } else {
            option.style.opacity = '1';
            option.style.pointerEvents = 'auto';
        }
    });
};

// 모든 큐브 드롭다운 옵션 업데이트
TerraformingMarsTracker.prototype.updateAllCubeDropdowns = function() {
    this.players.forEach(player => {
        this.updateCubeDropdownOptions(player.id);
    });
};

// 드롭다운을 절대 위치로 표시
TerraformingMarsTracker.prototype.showCubeDropdownAtPosition = function(dropdown, trigger, playerId) {
    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // 드롭다운을 body에 append
    if (dropdown.parentNode !== document.body) {
        document.body.appendChild(dropdown);
    }
    
    // 절대 위치로 설정
    dropdown.style.position = 'fixed';
    dropdown.style.left = triggerRect.left + 'px';
    dropdown.style.zIndex = '999999';
    
    // 위치 결정 (아래쪽 공간이 부족하면 위쪽으로)
    const dropdownHeight = 200; // 예상 드롭다운 높이
    if (triggerRect.bottom + dropdownHeight > viewportHeight - 20) {
        dropdown.style.top = (triggerRect.top - dropdownHeight) + 'px';
    } else {
        dropdown.style.top = triggerRect.bottom + 'px';
    }
    
    dropdown.style.display = 'block';
    this.updateCubeDropdownOptions(playerId);
};

// 드롭다운 위치 조정 (기존 함수 유지)
TerraformingMarsTracker.prototype.adjustDropdownPosition = function(dropdown, trigger) {
    // 초기 위치 설정
    dropdown.style.top = '100%';
    dropdown.style.bottom = 'auto';
    
    // 드롭다운이 표시된 후 위치 확인
    setTimeout(() => {
        const dropdownRect = dropdown.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // 드롭다운이 화면 아래로 잘리는 경우
        if (dropdownRect.bottom > viewportHeight - 20) {
            // 위쪽으로 열기
            dropdown.style.top = 'auto';
            dropdown.style.bottom = '100%';
        }
    }, 10);
};

// 큐브 아이콘 업데이트
TerraformingMarsTracker.prototype.updateCubeIcon = function(playerId) {
    const cubeSelect = document.getElementById(`cube${playerId}`);
    const cubeIcon = document.getElementById(`cubeIcon${playerId}`);
    const selectedOption = cubeSelect.options[cubeSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.icon) {
        cubeIcon.src = `img/${selectedOption.dataset.icon}`;
    } else {
        cubeIcon.src = 'img/black-square.svg';
    }
};

// 사용 가능한 옵션 업데이트 (중복 방지)
TerraformingMarsTracker.prototype.updateAvailableOptions = function() {
    const selectedCorps = [];
    
    // 현재 선택된 기업 수집
    this.players.forEach(player => {
        const corpSelect = document.getElementById(`corp${player.id}`);
        if (corpSelect && corpSelect.value) {
            selectedCorps.push(corpSelect.value);
        }
    });
    
    // 각 플레이어의 기업 옵션 업데이트
    this.players.forEach(player => {
        const corpSelect = document.getElementById(`corp${player.id}`);
        if (!corpSelect) return;
        
        const currentCorp = corpSelect.value;
        
        // 기업 옵션 업데이트
        corpSelect.innerHTML = '<option value="">기업 선택</option>';
        this.corporations.forEach(corp => {
            if (!selectedCorps.includes(corp) || corp === currentCorp) {
                const option = document.createElement('option');
                option.value = corp;
                option.textContent = corp;
                if (corp === currentCorp) option.selected = true;
                corpSelect.appendChild(option);
            }
        });
    });
};

TerraformingMarsTracker.prototype.addGame = function() {
    const mapName = document.getElementById('mapSelect').value;
    const gameResults = [];
    let allValid = true;

    // 점수 입력 검증 및 수집
    this.players.forEach(player => {
        const cubeColor = player.selectedCube; // 저장된 큐브 색상 사용
        const corporation = document.getElementById(`corp${player.id}`).value;
        const megacredits = parseInt(document.getElementById(`megacredits${player.id}`).value) || 0;
        
        // 세분화된 점수 수집
        const scoreBreakdown = {
            tr: parseInt(document.getElementById(`tr${player.id}`).value) || 0,
            awards: parseInt(document.getElementById(`awards${player.id}`).value) || 0,
            milestones: parseInt(document.getElementById(`milestones${player.id}`).value) || 0,
            druid: parseInt(document.getElementById(`druid${player.id}`).value) || 0,
            forest: parseInt(document.getElementById(`forest${player.id}`).value) || 0,
            city: parseInt(document.getElementById(`city${player.id}`).value) || 0,
            congress: parseInt(document.getElementById(`congress${player.id}`).value) || 0,
            cards: parseInt(document.getElementById(`cards${player.id}`).value) || 0
        };
        
        // 총점 계산
        const totalScore = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);

        if (!cubeColor || !corporation || totalScore <= 0) {
            allValid = false;
            return;
        }

        gameResults.push({
            playerId: player.id,
            playerName: player.name,
            cubeColor: cubeColor,
            corporation: corporation,
            score: totalScore,
            scoreBreakdown: scoreBreakdown,
            megacredits: megacredits
        });
    });

    if (!allValid) {
        alert('모든 플레이어의 큐브 색상, 기업명, 점수를 올바르게 입력해주세요.');
        return;
    }

    // 순위 계산 (점수 우선, 동점시 메가크레딧으로 결정)
    gameResults.sort((a, b) => {
        if (a.score !== b.score) {
            return b.score - a.score; // 점수 높은 순
        }
        return b.megacredits - a.megacredits; // 메가크레딧 높은 순
    });

    // 순위 부여
    gameResults.forEach((result, index) => {
        result.rank = index + 1;
    });

    // 배지 시스템 적용
    this.calculateBadges(gameResults);

    // 게임 기록 저장
    const game = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ko-KR'),
        map: mapName,
        results: gameResults
    };

    this.games.push(game);

    // 플레이어 통계 업데이트
    this.updatePlayerStats(gameResults);
    
    // 서버로 게임 데이터 동기화
    this.syncToServer('addGame', game);

    // 입력 필드 초기화 (큐브 색상은 유지)
    this.players.forEach(player => {
        document.getElementById(`megacredits${player.id}`).value = '';
        
        // 세분화된 점수 필드들 초기화
        const scoreFields = ['tr', 'awards', 'milestones', 'druid', 'forest', 'city', 'congress', 'cards'];
        scoreFields.forEach(field => {
            document.getElementById(`${field}${player.id}`).value = '';
        });
        
        // 총점 필드도 초기화
        document.getElementById(`totalScore${player.id}`).value = '';
    });
    
    // 맵 선택 강제 초기화
    const mapSelect = document.getElementById('mapSelect');
    const selectedMapName = document.getElementById('selectedMapName');
    
    if (mapSelect) {
        mapSelect.value = '';
        mapSelect.selectedIndex = 0;
    }
    
    if (selectedMapName) {
        selectedMapName.textContent = '맵을 선택해주세요';
        selectedMapName.classList.remove('selected');
    }
    
    // 개척기지 표시 숨기기
    const coloniesDisplay = document.getElementById('colonies-display');
    if (coloniesDisplay) {
        coloniesDisplay.classList.add('hidden');
    }
    
    // 플레이어 기업 선택 정보 먼저 초기화
    this.players.forEach(player => {
        player.selectedCorporation = null;
    });
    
    // 기업 드롭다운 강제 초기화
    this.players.forEach(player => {
        const corpSelect = document.getElementById(`corp${player.id}`);
        if (corpSelect) {
            corpSelect.value = '';
            // 옵션도 완전히 재생성
            corpSelect.innerHTML = '<option value="">기업 선택</option>';
            this.corporations.forEach(corp => {
                const option = document.createElement('option');
                option.value = corp;
                option.textContent = corp;
                corpSelect.appendChild(option);
            });
        }
    });

    // UI 업데이트
    this.updateRanking();
    this.updateHistory();
    this.saveData();

    alert('게임 결과가 추가되었습니다!');
};

TerraformingMarsTracker.prototype.updatePlayerStats = function(gameResults) {
    gameResults.forEach(result => {
        const player = this.players.find(p => p.id === result.playerId);
        if (player) {
            player.games.push(result);
            player.stats.totalGames++;
            player.stats.totalScore += result.score;
            player.stats.averageScore = Math.round(player.stats.totalScore / player.stats.totalGames * 10) / 10;

            // 순위별 카운트
            switch (result.rank) {
                case 1: player.stats.wins++; break;
                case 2: player.stats.seconds++; break;
                case 3: player.stats.thirds++; break;
                case 4: player.stats.fourths++; break;
            }
        }
    });
};

TerraformingMarsTracker.prototype.deleteGame = function(gameId) {
    if (!confirm('이 게임 기록을 삭제하시겠습니까?')) {
        return;
    }

    // 게임 찾기
    const gameIndex = this.games.findIndex(g => g.id === gameId);
    if (gameIndex === -1) return;

    const game = this.games[gameIndex];

    // 플레이어 통계에서 해당 게임 제거
    game.results.forEach(result => {
        const player = this.players.find(p => p.id === result.playerId);
        if (player) {
            // 게임 기록에서 제거
            const gameRecordIndex = player.games.findIndex(g => 
                g.score === result.score && g.megacredits === result.megacredits
            );
            if (gameRecordIndex !== -1) {
                player.games.splice(gameRecordIndex, 1);
            }

            // 통계 재계산
            player.stats.totalGames = player.games.length;
            player.stats.totalScore = player.games.reduce((sum, g) => sum + g.score, 0);
            player.stats.averageScore = player.stats.totalGames > 0 ? 
                Math.round(player.stats.totalScore / player.stats.totalGames * 10) / 10 : 0;

            // 순위별 카운트 재계산
            player.stats.wins = player.games.filter(g => g.rank === 1).length;
            player.stats.seconds = player.games.filter(g => g.rank === 2).length;
            player.stats.thirds = player.games.filter(g => g.rank === 3).length;
            player.stats.fourths = player.games.filter(g => g.rank === 4).length;
        }
    });

    // 게임 목록에서 제거
    this.games.splice(gameIndex, 1);
    
    // 서버로 게임 삭제 동기화
    this.syncToServer('deleteGame', gameId);

    // UI 업데이트
    this.updateRanking();
    this.updateHistory();
    this.saveData();
};

// 총점 자동 계산 함수
TerraformingMarsTracker.prototype.calculateTotalScore = function(playerId) {
    const scoreFields = ['tr', 'awards', 'milestones', 'druid', 'forest', 'city', 'congress', 'cards'];
    let totalScore = 0;
    
    scoreFields.forEach(field => {
        const input = document.getElementById(`${field}${playerId}`);
        const value = parseInt(input.value) || 0;
        totalScore += value;
    });
    
    // 총점 필드 업데이트
    const totalScoreInput = document.getElementById(`totalScore${playerId}`);
    totalScoreInput.value = totalScore;
};

// 배지 계산 함수
TerraformingMarsTracker.prototype.calculateBadges = function(gameResults) {
    // 각 결과에 배지 배열 초기화
    gameResults.forEach(result => {
        result.badges = [];
    });

    // 1. 테라포머 배지 (TR 가장 높으면서 50점 넘음)
    const maxTR = Math.max(...gameResults.map(r => r.scoreBreakdown.tr));
    if (maxTR >= 50) {
        const terraformers = gameResults.filter(r => r.scoreBreakdown.tr === maxTR);
        terraformers.forEach(result => {
            result.badges.push({ name: '테라포머', icon: '🌍', color: '#4299e1' });
        });
    }

    // 2. 선구자 배지 (업적 15점)
    gameResults.forEach(result => {
        if (result.scoreBreakdown.awards === 15) {
            result.badges.push({ name: '선구자', icon: '🏆', color: '#f6ad55' });
        }
    });

    // 3. 거물 배지 (기업상 15점)
    gameResults.forEach(result => {
        if (result.scoreBreakdown.milestones === 15) {
            result.badges.push({ name: '거물', icon: '💼', color: '#9f7aea' });
        }
    });

    // 4. 드루이드 배지 (드루이드 점수 가장 높으면서 20점 넘음)
    const maxDruid = Math.max(...gameResults.map(r => r.scoreBreakdown.druid));
    if (maxDruid >= 20) {
        const druids = gameResults.filter(r => r.scoreBreakdown.druid === maxDruid);
        druids.forEach(result => {
            result.badges.push({ name: '드루이드', icon: '🌿', color: '#48bb78' });
        });
    }

    // 5. 시장 배지 (도시 점수 가장 높음)
    const maxCity = Math.max(...gameResults.map(r => r.scoreBreakdown.city));
    if (maxCity > 0) {
        const mayors = gameResults.filter(r => r.scoreBreakdown.city === maxCity);
        if (mayors.length === 1) { // 단독 1위만
            mayors[0].badges.push({ name: '시장', icon: '🏙️', color: '#718096' });
        }
    }

    // 6. 임업가 배지 (숲 점수 가장 높음)
    const maxForest = Math.max(...gameResults.map(r => r.scoreBreakdown.forest));
    if (maxForest > 0) {
        const foresters = gameResults.filter(r => r.scoreBreakdown.forest === maxForest);
        if (foresters.length === 1) { // 단독 1위만
            foresters[0].badges.push({ name: '임업가', icon: '🌲', color: '#38a169' });
        }
    }

    // 7. 정치인 배지 (의회 점수 단독 가장 높음)
    const maxCongress = Math.max(...gameResults.map(r => r.scoreBreakdown.congress));
    if (maxCongress > 0) {
        const politicians = gameResults.filter(r => r.scoreBreakdown.congress === maxCongress);
        if (politicians.length === 1) { // 단독 1위만
            politicians[0].badges.push({ name: '정치인', icon: '🏛️', color: '#e53e3e' });
        }
    }

    // 8. 수집가 배지 (카드점수 단독 가장 높음)
    const maxCards = Math.max(...gameResults.map(r => r.scoreBreakdown.cards));
    if (maxCards > 0) {
        const collectors = gameResults.filter(r => r.scoreBreakdown.cards === maxCards);
        if (collectors.length === 1) { // 단독 1위만
            collectors[0].badges.push({ name: '수집가', icon: '🃏', color: '#d69e2e' });
        }
    }
};
