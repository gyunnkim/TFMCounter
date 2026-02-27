// 히스토리 관리 기능
TerraformingMarsTracker.prototype.updateHistory = function() {
    const container = document.getElementById('history-container');
    
    if (this.games.length === 0) {
        container.innerHTML = '<p>아직 게임 기록이 없습니다.</p>';
        return;
    }

    container.innerHTML = '';

    // 히스토리 헤더 추가 (통계 및 내보내기 버튼)
    if (this.games.length > 0) {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'history-header';
        headerDiv.innerHTML = `
            <div class="history-stats">
                <span id="history-game-count">📊 총 ${this.games.length}게임</span>
                <span id="history-date-range">📅 ${this.getDateRange()}</span>
            </div>
            <button onclick="tmTracker.exportHistoryData()" class="btn btn-success" style="padding: 8px 16px; font-size: 0.9rem;">
                📁 히스토리 내보내기
            </button>
        `;
        container.appendChild(headerDiv);
    }

    // 연속 날짜 그룹화
    const dateGroups = this.groupGamesByConsecutiveDates();
    
    // 그룹 정보 저장 (탭 전환 시 헤더 업데이트용)
    this.historyDateGroups = dateGroups;
    
    // 탭 컨테이너 생성
    const tabContainer = document.createElement('div');
    tabContainer.className = 'history-tabs-container';
    
    // 탭 버튼들 생성
    const tabButtons = document.createElement('div');
    tabButtons.className = 'history-tabs';
    
    // "전체" 탭 추가
    const allTabBtn = document.createElement('button');
    allTabBtn.className = 'history-tab-btn active';
    allTabBtn.textContent = '전체';
    allTabBtn.dataset.tabIndex = 'all';
    allTabBtn.onclick = () => this.switchHistoryTab('all');
    tabButtons.appendChild(allTabBtn);
    
    dateGroups.forEach((group, index) => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'history-tab-btn';
        tabBtn.textContent = group.label;
        tabBtn.dataset.tabIndex = index;
        tabBtn.onclick = () => this.switchHistoryTab(index);
        tabButtons.appendChild(tabBtn);
    });
    
    tabContainer.appendChild(tabButtons);
    container.appendChild(tabContainer);
    
    // 탭 콘텐츠 생성
    const tabContents = document.createElement('div');
    tabContents.className = 'history-tab-contents';
    
    // "전체" 탭 콘텐츠
    const allTabContent = document.createElement('div');
    allTabContent.className = 'history-tab-content active';
    allTabContent.dataset.tabIndex = 'all';
    
    // 전체 게임 표시 (최신순)
    [...this.games].sort((a, b) => {
        const dateA = this.parseGameDateForSort(a);
        const dateB = this.parseGameDateForSort(b);
        return dateB - dateA;
    }).forEach(game => {
        const gameDiv = this.createGameHistoryElement(game);
        allTabContent.appendChild(gameDiv);
    });
    tabContents.appendChild(allTabContent);
    
    dateGroups.forEach((group, index) => {
        const tabContent = document.createElement('div');
        tabContent.className = 'history-tab-content';
        tabContent.dataset.tabIndex = index;
        
        // 그룹 내 게임들 표시 (최신순)
        group.games.forEach(game => {
            const gameDiv = this.createGameHistoryElement(game);
            tabContent.appendChild(gameDiv);
        });
        
        tabContents.appendChild(tabContent);
    });
    
    container.appendChild(tabContents);
};

// 날짜 파싱 (정렬용)
TerraformingMarsTracker.prototype.parseGameDateForSort = function(game) {
    if (game.date instanceof Date) return game.date;
    if (typeof game.date === 'string') {
        const isoParsed = new Date(game.date);
        if (!isNaN(isoParsed.getTime())) return isoParsed;
        const m = game.date.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
        if (m) {
            return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
        }
    }
    return new Date(NaN);
};

// 연속 날짜 그룹화 함수
TerraformingMarsTracker.prototype.groupGamesByConsecutiveDates = function() {
    // 날짜만 추출 (시간 제거)
    const getDateOnly = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };
    
    const parseGameDate = (game) => {
        if (game.date instanceof Date) return getDateOnly(game.date);
        if (typeof game.date === 'string') {
            const isoParsed = new Date(game.date);
            if (!isNaN(isoParsed.getTime())) return getDateOnly(isoParsed);
            const m = game.date.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
            if (m) {
                const y = parseInt(m[1], 10);
                const mo = parseInt(m[2], 10) - 1;
                const d = parseInt(m[3], 10);
                return new Date(y, mo, d);
            }
        }
        return new Date(NaN);
    };
    
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}.${m}.${d}.`;
    };
    
    // 게임을 날짜별로 정렬 (최신순)
    const gamesWithDates = this.games.map(game => ({
        game,
        date: parseGameDate(game)
    })).filter(item => !isNaN(item.date.getTime()));
    
    gamesWithDates.sort((a, b) => b.date - a.date);
    
    if (gamesWithDates.length === 0) return [];
    
    const groups = [];
    let currentGroup = {
        games: [gamesWithDates[0].game],
        startDate: gamesWithDates[0].date,
        endDate: gamesWithDates[0].date
    };
    
    for (let i = 1; i < gamesWithDates.length; i++) {
        const currentDate = gamesWithDates[i].date;
        const prevDate = gamesWithDates[i - 1].date;
        
        // 날짜 차이 계산 (일 단위) - 시간이 제거되어 정확함
        const diffDays = Math.round((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
            // 연속된 날짜 (같은 날 또는 하루 차이)
            currentGroup.games.push(gamesWithDates[i].game);
            currentGroup.endDate = currentDate;
        } else {
            // 새 그룹 시작
            groups.push(currentGroup);
            currentGroup = {
                games: [gamesWithDates[i].game],
                startDate: currentDate,
                endDate: currentDate
            };
        }
    }
    groups.push(currentGroup);
    
    // 라벨 생성
    groups.forEach(group => {
        const start = formatDate(group.endDate);  // endDate가 더 과거
        const end = formatDate(group.startDate);  // startDate가 더 최신
        if (start === end) {
            group.label = start.replace(/\.$/, '');
        } else {
            group.label = `${start.replace(/\.$/, '')}~${end.replace(/\.$/, '')}`;
        }
    });
    
    return groups;
};

// 히스토리 탭 전환
TerraformingMarsTracker.prototype.switchHistoryTab = function(index) {
    // 현재 선택된 탭 저장
    this.currentHistoryTab = index;
    
    // 탭 버튼 활성화 상태 변경
    document.querySelectorAll('.history-tab-btn').forEach(btn => {
        const btnIndex = btn.dataset.tabIndex;
        btn.classList.toggle('active', btnIndex === String(index));
    });
    
    // 탭 콘텐츠 활성화 상태 변경
    document.querySelectorAll('.history-tab-content').forEach(content => {
        const contentIndex = content.dataset.tabIndex;
        content.classList.toggle('active', contentIndex === String(index));
    });
    
    // 헤더 통계 업데이트
    this.updateHistoryHeader(index);
    
    // 랭킹 업데이트 (해당 탭의 게임 데이터로)
    this.updateRankingForTab(index);
};

// 탭에 맞는 게임 데이터 가져오기
TerraformingMarsTracker.prototype.getGamesForTab = function(tabIndex) {
    if (tabIndex === 'all') {
        return this.games;
    } else {
        const groupIndex = parseInt(tabIndex);
        const group = this.historyDateGroups[groupIndex];
        return group ? group.games : [];
    }
};

// 탭에 맞는 랭킹 업데이트
TerraformingMarsTracker.prototype.updateRankingForTab = function(tabIndex) {
    const games = this.getGamesForTab(tabIndex);
    
    // 해당 게임들로 플레이어 통계 계산
    const playerStats = this.calculatePlayerStatsFromGames(games);
    
    // 랭킹 UI 업데이트
    this.updatePlayerRankingWithStats(playerStats);
    this.updateCorporationRankingForGames(games);
    this.updateMapRankingForGames(games);
};

// 게임 목록에서 플레이어 통계 계산
TerraformingMarsTracker.prototype.calculatePlayerStatsFromGames = function(games) {
    const stats = {};
    
    games.forEach(game => {
        game.results.forEach(result => {
            const name = result.playerName;
            if (!stats[name]) {
                stats[name] = {
                    name: name,
                    totalGames: 0,
                    totalScore: 0,
                    wins: 0,
                    seconds: 0,
                    thirds: 0,
                    fourths: 0,
                    averageScore: 0
                };
            }
            
            stats[name].totalGames++;
            stats[name].totalScore += result.score;
            
            if (result.rank === 1) stats[name].wins++;
            else if (result.rank === 2) stats[name].seconds++;
            else if (result.rank === 3) stats[name].thirds++;
            else if (result.rank === 4) stats[name].fourths++;
        });
    });
    
    // 평균 점수 계산
    Object.values(stats).forEach(player => {
        if (player.totalGames > 0) {
            player.averageScore = Math.round((player.totalScore / player.totalGames) * 10) / 10;
        }
    });
    
    return Object.values(stats);
};

// 통계 데이터로 플레이어 랭킹 업데이트
TerraformingMarsTracker.prototype.updatePlayerRankingWithStats = function(playerStats) {
    const container = document.getElementById('player-ranking');
    
    if (playerStats.length === 0) {
        container.innerHTML = '<p>해당 기간에 게임 기록이 없습니다.</p>';
        return;
    }

    // 랭킹 계산 로직
    const rankedPlayers = [...playerStats].sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        if (a.seconds !== b.seconds) return b.seconds - a.seconds;
        if (a.thirds !== b.thirds) return b.thirds - a.thirds;
        return b.averageScore - a.averageScore;
    });

    container.innerHTML = '';

    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
        const header = document.createElement('div');
        header.className = 'ranking-item ranking-header-row';
        header.innerHTML = `
            <div class="rank-number"><strong>순위</strong></div>
            <div class="player-name"><strong>플레이어</strong></div>
            <div class="stat"><strong>1등</strong></div>
            <div class="stat"><strong>2등</strong></div>
            <div class="stat"><strong>3등</strong></div>
            <div class="stat"><strong>평균점수</strong></div>
        `;
        header.style.background = '#4a5568';
        header.style.color = 'white';
        header.style.marginBottom = '5px';
        container.appendChild(header);
    }

    rankedPlayers.forEach((player, index) => {
        const rankingDiv = document.createElement('div');
        rankingDiv.className = 'ranking-item';
        
        if (index === 0) rankingDiv.classList.add('first');
        else if (index === 1) rankingDiv.classList.add('second');
        else if (index === 2) rankingDiv.classList.add('third');

        if (isMobile) {
            rankingDiv.classList.add('card-layout');
            rankingDiv.innerHTML = `
                <div class="rank-number">${index + 1}등</div>
                <div class="player-name">${player.name}</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">1등</span>
                        <span class="stat-value">${player.wins}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">2등</span>
                        <span class="stat-value">${player.seconds}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">3등</span>
                        <span class="stat-value">${player.thirds}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">평균점수</span>
                        <span class="stat-value">${player.averageScore}점</span>
                    </div>
                </div>
            `;
        } else {
            rankingDiv.innerHTML = `
                <div class="rank-number">${index + 1}</div>
                <div class="player-name">${player.name}</div>
                <div class="stat">${player.wins}</div>
                <div class="stat">${player.seconds}</div>
                <div class="stat">${player.thirds}</div>
                <div class="stat">${player.averageScore}</div>
            `;
        }
        
        container.appendChild(rankingDiv);
    });
};

// 히스토리 헤더 통계 업데이트
TerraformingMarsTracker.prototype.updateHistoryHeader = function(tabIndex) {
    const gameCountEl = document.getElementById('history-game-count');
    const dateRangeEl = document.getElementById('history-date-range');
    
    if (!gameCountEl || !dateRangeEl) return;
    
    if (tabIndex === 'all') {
        // 전체 탭
        gameCountEl.textContent = `📊 총 ${this.games.length}게임`;
        dateRangeEl.textContent = `📅 ${this.getDateRange()}`;
    } else {
        // 특정 날짜 그룹 탭
        const groupIndex = parseInt(tabIndex);
        const group = this.historyDateGroups[groupIndex];
        
        if (group) {
            gameCountEl.textContent = `📊 총 ${group.games.length}게임`;
            dateRangeEl.textContent = `📅 ${group.label}`;
        }
    }
};

// 게임 히스토리 요소 생성
TerraformingMarsTracker.prototype.createGameHistoryElement = function(game) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game-history';

    const header = document.createElement('div');
    header.className = 'game-header';
    const displayDate = game.dateDisplay || (typeof game.date === 'string' ? game.date : '');
    header.innerHTML = `
        <span>📅 ${displayDate} - 🗺️ ${game.map}</span>
        <button onclick="tmTracker.deleteGame(${game.id})" class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;">삭제</button>
    `;

    const results = document.createElement('div');
    results.className = 'game-results';

    game.results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'player-result';
        if (result.rank === 1) resultDiv.classList.add('winner');

        const cubeIcon = result.cubeColor ? `img/${result.cubeColor}-square.svg` : 'img/black-square.svg';
        
        const badgesHtml = result.badges && result.badges.length > 0 
            ? `<div class="badges" style="margin-top: 4px;">${result.badges.map(badge => 
                `<span class="badge" style="background-color: ${badge.color}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.7rem; margin-right: 4px; display: inline-block;">
                    ${badge.icon} ${badge.name}
                </span>`
            ).join('')}</div>`
            : '';

        resultDiv.innerHTML = `
            <div><strong>${result.rank}등</strong></div>
            <div class="player-info">
                <img src="${cubeIcon}" alt="${result.cubeColor} 큐브" class="cube-icon-small" style="width: 16px; height: 16px; margin-right: 4px;">
                ${result.playerName}
            </div>
            <div>(${result.corporation})</div>
            <div>점수: ${result.score}</div>
            <div>💰 ${result.megacredits}</div>
            ${badgesHtml}
        `;
        results.appendChild(resultDiv);
    });

    gameDiv.appendChild(header);
    gameDiv.appendChild(results);
    return gameDiv;
};

// 날짜 범위 계산
TerraformingMarsTracker.prototype.getDateRange = function() {
    if (this.games.length === 0) return '';

    const parseGameDate = (game) => {
        if (game.date instanceof Date) return game.date;
        if (typeof game.date === 'string') {
            // ISO는 대부분 환경에서 안전
            const isoParsed = new Date(game.date);
            if (!isNaN(isoParsed.getTime())) return isoParsed;

            // 구형 저장 포맷: 'YYYY. M. D.' / 'YYYY. MM. DD.' 형태 수동 파싱
            const m = game.date.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
            if (m) {
                const y = parseInt(m[1], 10);
                const mo = parseInt(m[2], 10) - 1;
                const d = parseInt(m[3], 10);
                return new Date(Date.UTC(y, mo, d));
            }
        }
        return new Date(NaN);
    };

    const dates = this.games.map(parseGameDate).filter(d => !isNaN(d.getTime())).sort((a, b) => a - b);
    if (dates.length === 0) return '';
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '.').replace(/\s/g, '');
    };
    
    if (dates.length === 1) {
        return formatDate(firstDate);
    } else {
        return `${formatDate(firstDate)} ~ ${formatDate(lastDate)}`;
    }
};

// 히스토리 데이터 내보내기 (통합 파일)
TerraformingMarsTracker.prototype.exportHistoryData = function() {
    if (this.games.length === 0) {
        alert('내보낼 게임 데이터가 없습니다.');
        return;
    }

    // 기존 exportData 함수와 동일한 로직 사용
    this.exportData();
};

