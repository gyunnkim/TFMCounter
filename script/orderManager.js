// 플레이어 순서 정하기 기능
TerraformingMarsTracker.prototype.randomizePlayerOrder = function() {
    if (this.players.length < 2) {
        alert('최소 2명의 플레이어가 필요합니다.');
        return;
    }

    // 플레이어 배열 복사 및 셔플
    const shuffledPlayers = [...this.players];
    
    // Fisher-Yates 셔플 알고리즘
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }

    // 플레이어에 순서 할당
    shuffledPlayers.forEach((player, index) => {
        player.playOrder = index + 1;
    });
    
    // 순서 결과 표시
    this.showPlayerOrder(shuffledPlayers);
    
    // 순서 정하기 버튼 텍스트 변경 (비활성화하지 않음)
    const orderButton = document.getElementById('randomizeOrder');
    if (orderButton) {
        orderButton.textContent = '🔄 순서 다시 정하기';
    }
    
    // 게임 입력 UI 업데이트 (순서 표시)
    this.updateGameInputsWithOrder();
    
    // 플레이어 순서대로 재배치 여부 확인
    setTimeout(() => {
        if (confirm('플레이어를 순서대로 재배치하시겠습니까?\n(게임 결과에는 영향 없이 UI만 정렬됩니다)')) {
            this.rearrangePlayersByOrder();
        }
    }, 500);
    
    // 서버로 순서 데이터 동기화
    this.syncToServer('updatePlayerOrder', {
        players: this.players
    });
    
    // 로컬 스토리지도 업데이트
    this.saveData();
};

TerraformingMarsTracker.prototype.showPlayerOrder = function(orderedPlayers) {
    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'order-modal';
    modal.innerHTML = `
        <div class="order-modal-content">
            <div class="order-header">
                <h3>🎲 플레이어 순서</h3>
                <button class="order-close">&times;</button>
            </div>
            <div class="order-body">
                <div class="order-list">
                    ${orderedPlayers.map((player, index) => `
                        <div class="order-item" style="animation-delay: ${index * 0.2}s">
                            <div class="order-number">${index + 1}</div>
                            <div class="order-player">
                                <div class="order-cube" style="background-color: ${this.getCubeColor(player.selectedCube)}"></div>
                                <div class="order-name">${player.name}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-actions">
                    <button class="btn btn-secondary order-reroll">🎲 다시 정하기</button>
                    <button class="btn btn-primary order-confirm">확인</button>
                </div>
            </div>
        </div>
    `;

    // 모달 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .order-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }

        .order-modal-content {
            background: white;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
        }

        .order-header h3 {
            margin: 0;
            color: #2d3748;
        }

        .order-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #718096;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .order-close:hover {
            color: #2d3748;
        }

        .order-body {
            padding: 20px;
        }

        .order-list {
            margin-bottom: 20px;
        }

        .order-item {
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f7fafc;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            animation: slideInUp 0.5s ease forwards;
            opacity: 0;
            transform: translateY(20px);
        }

        .order-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
            margin-right: 15px;
            min-width: 30px;
        }

        .order-player {
            display: flex;
            align-items: center;
        }

        .order-cube {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            margin-right: 10px;
            border: 2px solid #2d3748;
        }

        .order-name {
            font-weight: 600;
            color: #2d3748;
        }

        .order-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        @keyframes slideInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 768px) {
            .order-modal-content {
                margin: 20px;
                width: calc(100% - 40px);
            }
            
            .order-actions {
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // 이벤트 리스너
    const closeBtn = modal.querySelector('.order-close');
    const rerollBtn = modal.querySelector('.order-reroll');
    const confirmBtn = modal.querySelector('.order-confirm');

    const closeModal = () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    };

    closeBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', closeModal);
    rerollBtn.addEventListener('click', () => {
        closeModal();
        this.randomizePlayerOrder();
    });

    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
};

TerraformingMarsTracker.prototype.getCubeColor = function(cubeType) {
    const colors = {
        'red': '#e53e3e',
        'green': '#38a169',
        'yellow': '#d69e2e',
        'blue': '#3182ce',
        'black': '#2d3748',
        'white': '#f7fafc'
    };
    return colors[cubeType] || '#718096';
};

// 게임 입력 UI에 순서 표시 업데이트
TerraformingMarsTracker.prototype.updateGameInputsWithOrder = function() {
    console.log('순서 표시 업데이트 시작, 플레이어 수:', this.players.length);
    
    this.players.forEach((player, index) => {
        // 여러 방법으로 플레이어 라벨 찾기
        let playerNameLabel = document.querySelector(`#game-scores-container .score-input:nth-child(${index + 1}) .player-name-label`);
        
        // 다른 방법으로도 시도
        if (!playerNameLabel) {
            playerNameLabel = document.querySelector(`#game-scores-container .player-name-label`);
            if (playerNameLabel) {
                const allLabels = document.querySelectorAll('#game-scores-container .player-name-label');
                playerNameLabel = allLabels[index];
            }
        }
        
        console.log(`플레이어 ${player.name} (${index}): 라벨 찾음 = ${!!playerNameLabel}, 순서 = ${player.playOrder}`);
        
        if (playerNameLabel && player.playOrder) {
            // 기존 순서 표시 제거
            const existingOrder = playerNameLabel.querySelector('.play-order');
            if (existingOrder) {
                existingOrder.remove();
            }
            
            // 새 순서 표시 추가
            const orderSpan = document.createElement('span');
            orderSpan.className = 'play-order';
            orderSpan.textContent = ` (${player.playOrder}번째)`;
            orderSpan.style.cssText = `
                color: #667eea;
                font-weight: 600;
                font-size: 0.9rem;
                margin-left: 8px;
                display: inline-block;
            `;
            playerNameLabel.appendChild(orderSpan);
            
            console.log(`✅ 순서 표시 추가 성공: ${player.name} - ${player.playOrder}번째`);
        } else if (player.playOrder) {
            console.log(`❌ 플레이어 라벨을 찾을 수 없음: ${player.name}, playOrder: ${player.playOrder}`);
        }
    });
};

// 순서 초기화 함수
TerraformingMarsTracker.prototype.resetPlayerOrder = function() {
    // 플레이어 순서 제거
    this.players.forEach(player => {
        delete player.playOrder;
    });
    
    // 순서 정하기 버튼 원래대로 복원
    const orderButton = document.getElementById('randomizeOrder');
    if (orderButton) {
        orderButton.disabled = false;
        orderButton.textContent = '🎲 순서 정하기';
        orderButton.classList.remove('disabled');
    }
    
    // UI에서 순서 표시 제거
    const orderSpans = document.querySelectorAll('.play-order');
    orderSpans.forEach(span => span.remove());
    
    // 서버로 순서 초기화 동기화
    this.syncToServer('resetPlayerOrder', {
        players: this.players
    });
    
    // 로컬 스토리지도 업데이트
    this.saveData();
};

// 플레이어 순서대로 재배치
TerraformingMarsTracker.prototype.rearrangePlayersByOrder = function() {
    console.log('플레이어 순서대로 재배치 시작');
    
    // 순서가 있는 플레이어만 필터링하고 순서대로 정렬
    const playersWithOrder = this.players.filter(player => player.playOrder);
    const playersWithoutOrder = this.players.filter(player => !player.playOrder);
    
    if (playersWithOrder.length === 0) {
        alert('먼저 순서를 정해주세요.');
        return;
    }
    
    // 순서대로 정렬
    playersWithOrder.sort((a, b) => a.playOrder - b.playOrder);
    
    // 기존 ID 저장 (게임 결과 연결을 위해)
    const originalIds = playersWithOrder.map(player => player.id);
    
    // 새로운 ID 할당 (1, 2, 3, 4 순서대로)
    playersWithOrder.forEach((player, index) => {
        player.id = index + 1;
    });
    
    // 순서 없는 플레이어들도 뒤에 배치
    playersWithoutOrder.forEach((player, index) => {
        player.id = playersWithOrder.length + index + 1;
    });
    
    // 플레이어 배열 재구성
    this.players = [...playersWithOrder, ...playersWithoutOrder];
    
    console.log('플레이어 재배치 완료:', this.players.map(p => `${p.name}(${p.playOrder}번째)`));
    
    // UI 즉시 업데이트
    this.generateGameInputs();
    
    // 순서 표시 업데이트
    setTimeout(() => {
        this.updateGameInputsWithOrder();
    }, 100);
    
    // 서버로 재배치된 플레이어 동기화
    this.syncToServer('rearrangePlayersByOrder', {
        players: this.players,
        originalIds: originalIds
    });
    
    // 로컬 스토리지 업데이트
    this.saveData();
    
    // 성공 메시지
    const orderText = playersWithOrder.map(p => `${p.playOrder}번째: ${p.name}`).join('\n');
    alert(`플레이어가 순서대로 재배치되었습니다!\n\n${orderText}`);
};

// 개척기지 뽑기 기능
TerraformingMarsTracker.prototype.randomizeColonies = function() {
    if (this.players.length < 3) {
        alert('최소 3명의 플레이어가 필요합니다.');
        return;
    }

    // 11개의 개척기지 목록
    const allColonies = [
        '칼리스토', '트리튼', '미란다', '가니메데', '유로파', 
        '명왕성', '엔셀라두스', '세레스', '달', '이오', '타이탄'
    ];

    // 플레이어 수에 따른 개척기지 개수 결정
    const colonyCount = this.players.length === 3 ? 5 : 6;

    // Fisher-Yates 셔플로 무작위 선택
    const shuffledColonies = [...allColonies];
    for (let i = shuffledColonies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledColonies[i], shuffledColonies[j]] = [shuffledColonies[j], shuffledColonies[i]];
    }

    // 필요한 개수만큼 선택
    const selectedColonies = shuffledColonies.slice(0, colonyCount);

    // 결과 표시
    this.showColonySelection(selectedColonies);
};

TerraformingMarsTracker.prototype.showColonySelection = function(selectedColonies) {
    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'colony-modal';
    modal.innerHTML = `
        <div class="colony-modal-content">
            <div class="colony-header">
                <h3>🚀 선택된 개척기지</h3>
                <button class="colony-close">&times;</button>
            </div>
            <div class="colony-body">
                <div class="colony-info">
                    <p>플레이어 ${this.players.length}명 → 개척기지 ${selectedColonies.length}개</p>
                </div>
                <div class="colony-list">
                    ${selectedColonies.map((colony, index) => `
                        <div class="colony-item" style="animation-delay: ${index * 0.15}s">
                            <div class="colony-icon">🌍</div>
                            <div class="colony-name">${colony}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="colony-actions">
                    <button class="btn btn-secondary colony-reroll">🎲 다시 뽑기</button>
                    <button class="btn btn-primary colony-confirm">확인</button>
                </div>
            </div>
        </div>
    `;

    // 모달 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .colony-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }

        .colony-modal-content {
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .colony-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px 12px 0 0;
        }

        .colony-header h3 {
            margin: 0;
        }

        .colony-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: white;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .colony-close:hover {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
        }

        .colony-body {
            padding: 20px;
        }

        .colony-info {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #f7fafc;
            border-radius: 8px;
            color: #4a5568;
            font-weight: 600;
        }

        .colony-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }

        .colony-item {
            display: flex;
            align-items: center;
            padding: 15px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 10px;
            color: white;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
            animation: slideInUp 0.6s ease forwards;
            opacity: 0;
            transform: translateY(20px);
        }

        .colony-icon {
            font-size: 1.5rem;
            margin-right: 12px;
        }

        .colony-name {
            font-size: 1.1rem;
        }

        .colony-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        @keyframes slideInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 768px) {
            .colony-modal-content {
                margin: 20px;
                width: calc(100% - 40px);
            }
            
            .colony-list {
                grid-template-columns: 1fr;
            }
            
            .colony-actions {
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // 이벤트 리스너
    const closeBtn = modal.querySelector('.colony-close');
    const rerollBtn = modal.querySelector('.colony-reroll');
    const confirmBtn = modal.querySelector('.colony-confirm');

    const closeModal = () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    };

    closeBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', closeModal);
    rerollBtn.addEventListener('click', () => {
        closeModal();
        this.randomizeColonies();
    });

    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
};

// 맵 랜덤 선택 기능
TerraformingMarsTracker.prototype.randomizeMap = function() {
    // 6개 공식 맵 목록
    const allMaps = [
        { value: 'THARSIS', name: '타르시스 (THARSIS)', description: '기본 맵' },
        { value: 'HELLAS', name: '헬라스 (HELLAS)', description: '남극 맵' },
        { value: 'ELYSIUM', name: '엘리시움 (ELYSIUM)', description: '북극 맵' },
        { value: 'VASTITAS BOREALIS', name: '바스티타스 보레알리스', description: '북극 평원' },
        { value: 'UTOPIA PLANITIA', name: '유토피아 플라니티아', description: '유토피아 평원' },
        { value: 'TERRA CIMERIA', name: '테라 시메리아', description: '시메리아 대륙' }
    ];

    // 무작위 선택
    const randomIndex = Math.floor(Math.random() * allMaps.length);
    const selectedMap = allMaps[randomIndex];

    // 맵 선택 결과 표시
    this.showMapSelection(selectedMap, allMaps);
};

TerraformingMarsTracker.prototype.showMapSelection = function(selectedMap, allMaps) {
    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
        <div class="map-modal-content">
            <div class="map-header">
                <h3>🗺️ 선택된 맵</h3>
                <button class="map-close">&times;</button>
            </div>
            <div class="map-body">
                <div class="selected-map">
                    <div class="map-icon">🌍</div>
                    <div class="map-info">
                        <h4>${selectedMap.name}</h4>
                        <p>${selectedMap.description}</p>
                    </div>
                </div>
                <div class="all-maps-info">
                    <h5>전체 맵 목록:</h5>
                    <div class="maps-grid">
                        ${allMaps.map(map => `
                            <div class="map-item ${map.value === selectedMap.value ? 'selected' : ''}">
                                <div class="map-name">${map.name}</div>
                                <div class="map-desc">${map.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="map-actions">
                    <button class="btn btn-secondary map-reroll">🎲 다시 뽑기</button>
                    <button class="btn btn-primary map-confirm">확인</button>
                </div>
            </div>
        </div>
    `;

    // 모달 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .map-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }

        .map-modal-content {
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .map-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border-radius: 12px 12px 0 0;
        }

        .map-header h3 {
            margin: 0;
        }

        .map-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: white;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .map-close:hover {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
        }

        .map-body {
            padding: 20px;
        }

        .selected-map {
            display: flex;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            color: white;
            margin-bottom: 25px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .map-icon {
            font-size: 3rem;
            margin-right: 20px;
        }

        .map-info h4 {
            margin: 0 0 8px 0;
            font-size: 1.4rem;
        }

        .map-info p {
            margin: 0;
            opacity: 0.9;
            font-size: 1rem;
        }

        .all-maps-info {
            margin-bottom: 25px;
        }

        .all-maps-info h5 {
            margin: 0 0 15px 0;
            color: #4a5568;
            font-size: 1.1rem;
        }

        .maps-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
        }

        .map-item {
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            transition: all 0.3s ease;
        }

        .map-item.selected {
            border-color: #667eea;
            background: #f7fafc;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }

        .map-name {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
            font-size: 0.9rem;
        }

        .map-desc {
            font-size: 0.8rem;
            color: #718096;
        }

        .map-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        @media (max-width: 768px) {
            .map-modal-content {
                margin: 20px;
                width: calc(100% - 40px);
            }
            
            .maps-grid {
                grid-template-columns: 1fr;
            }
            
            .map-actions {
                flex-direction: column;
            }
            
            .selected-map {
                flex-direction: column;
                text-align: center;
            }
            
            .map-icon {
                margin: 0 0 15px 0;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // 이벤트 리스너
    const closeBtn = modal.querySelector('.map-close');
    const rerollBtn = modal.querySelector('.map-reroll');
    const confirmBtn = modal.querySelector('.map-confirm');

    const closeModal = () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    };

    closeBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        // 맵 선택 적용
        this.applySelectedMap(selectedMap.value);
        closeModal();
    });
    
    rerollBtn.addEventListener('click', () => {
        closeModal();
        this.randomizeMap();
    });

    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
};

TerraformingMarsTracker.prototype.applySelectedMap = function(mapValue) {
    // 맵 드롭다운 업데이트 (숨겨진 select)
    const mapSelect = document.getElementById('mapSelect');
    if (mapSelect) {
        mapSelect.value = mapValue;
    }
    
    // 선택된 맵 표시 업데이트
    this.updateSelectedMapDisplay(mapValue);
    
    // 선택된 맵 저장
    this.selectedMap = mapValue;
    
    // 서버로 맵 선택 동기화
    this.syncToServer('updateSelectedMap', {
        selectedMap: mapValue
    });
    
    // 로컬 스토리지도 업데이트
    this.saveData();
    
    console.log('맵 랜덤 선택 완료:', mapValue);
};

// 선택된 맵 표시 업데이트
TerraformingMarsTracker.prototype.updateSelectedMapDisplay = function(mapValue) {
    const mapNameElement = document.getElementById('selectedMapName');
    if (mapNameElement && mapValue) {
        // 맵 이름 매핑
        const mapNames = {
            'THARSIS': '타르시스 (THARSIS)',
            'HELLAS': '헬라스 (HELLAS)',
            'ELYSIUM': '엘리시움 (ELYSIUM)',
            'VASTITAS BOREALIS': '바스티타스 보레알리스',
            'UTOPIA PLANITIA': '유토피아 플라니티아',
            'TERRA CIMERIA': '테라 시메리아'
        };
        
        mapNameElement.textContent = mapNames[mapValue] || mapValue;
        mapNameElement.classList.add('selected');
        
        console.log('맵 표시 업데이트:', mapNames[mapValue] || mapValue);
    }
};
