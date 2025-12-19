// 랭킹 관리 기능
TerraformingMarsTracker.prototype.updateRanking = function() {
    this.updatePlayerRanking();
    this.updateCorporationRanking();
    this.updateMapRanking();
};

TerraformingMarsTracker.prototype.showPlayerRanking = function() {
    document.getElementById('playerRankingTab').classList.add('active');
    document.getElementById('corporationRankingTab').classList.remove('active');
    document.getElementById('mapRankingTab').classList.remove('active');
    document.getElementById('player-ranking').classList.add('active');
    document.getElementById('corporation-ranking').classList.remove('active');
    document.getElementById('map-ranking').classList.remove('active');
};

TerraformingMarsTracker.prototype.showCorporationRanking = function() {
    document.getElementById('playerRankingTab').classList.remove('active');
    document.getElementById('corporationRankingTab').classList.add('active');
    document.getElementById('mapRankingTab').classList.remove('active');
    document.getElementById('player-ranking').classList.remove('active');
    document.getElementById('corporation-ranking').classList.add('active');
    document.getElementById('map-ranking').classList.remove('active');
};

TerraformingMarsTracker.prototype.showMapRanking = function() {
    document.getElementById('playerRankingTab').classList.remove('active');
    document.getElementById('corporationRankingTab').classList.remove('active');
    document.getElementById('mapRankingTab').classList.add('active');
    document.getElementById('player-ranking').classList.remove('active');
    document.getElementById('corporation-ranking').classList.remove('active');
    document.getElementById('map-ranking').classList.add('active');
};

TerraformingMarsTracker.prototype.updatePlayerRanking = function() {
    const container = document.getElementById('player-ranking');
    
    if (this.players.length === 0) {
        container.innerHTML = '<p>플레이어를 설정해주세요.</p>';
        return;
    }

    // 랭킹 계산 로직
    const rankedPlayers = [...this.players].sort((a, b) => {
        // 1등 횟수로 먼저 정렬
        if (a.stats.wins !== b.stats.wins) {
            return b.stats.wins - a.stats.wins;
        }
        // 2등 횟수로 정렬
        if (a.stats.seconds !== b.stats.seconds) {
            return b.stats.seconds - a.stats.seconds;
        }
        // 3등 횟수로 정렬
        if (a.stats.thirds !== b.stats.thirds) {
            return b.stats.thirds - a.stats.thirds;
        }
        // 평균 점수로 정렬
        return b.stats.averageScore - a.stats.averageScore;
    });

    container.innerHTML = '';

    // PC에서만 헤더 추가
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
        
        // 1, 2, 3등에 특별한 스타일 적용
        if (index === 0) rankingDiv.classList.add('first');
        else if (index === 1) rankingDiv.classList.add('second');
        else if (index === 2) rankingDiv.classList.add('third');

        // PC와 모바일 구분
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // 모바일: 카드형 레이아웃
            rankingDiv.classList.add('card-layout');
            rankingDiv.innerHTML = `
                <div class="rank-number">${index + 1}등</div>
                <div class="player-name">${player.name}</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">1등</span>
                        <span class="stat-value">${player.stats.wins}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">2등</span>
                        <span class="stat-value">${player.stats.seconds}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">3등</span>
                        <span class="stat-value">${player.stats.thirds}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">평균점수</span>
                        <span class="stat-value">${player.stats.averageScore}점</span>
                    </div>
                </div>
            `;
        } else {
            // PC: 테이블형 레이아웃
            rankingDiv.innerHTML = `
                <div class="rank-number">${index + 1}</div>
                <div class="player-name">${player.name}</div>
                <div class="stat">${player.stats.wins}</div>
                <div class="stat">${player.stats.seconds}</div>
                <div class="stat">${player.stats.thirds}</div>
                <div class="stat">${player.stats.averageScore}</div>
            `;
        }
        
        container.appendChild(rankingDiv);
    });
};
