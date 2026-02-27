// 기업별 랭킹 기능
TerraformingMarsTracker.prototype.updateCorporationRanking = function() {
    this.updateCorporationRankingForGames(this.games);
};

// 특정 게임 목록으로 기업별 랭킹 업데이트
TerraformingMarsTracker.prototype.updateCorporationRankingForGames = function(games) {
    const container = document.getElementById('corporation-ranking');
    
    if (games.length === 0) {
        container.innerHTML = '<p>해당 기간에 게임 기록이 없습니다.</p>';
        return;
    }

    // 기업별 통계 계산
    const corporationStats = {};
    
    games.forEach(game => {
        game.results.forEach(result => {
            if (!corporationStats[result.corporation]) {
                corporationStats[result.corporation] = {
                    totalGames: 0,
                    totalScore: 0,
                    wins: 0,
                    seconds: 0,
                    thirds: 0,
                    averageScore: 0,
                    bestScore: 0,
                    worstScore: Infinity,
                    players: new Set()
                };
            }

            const corpStat = corporationStats[result.corporation];
            corpStat.totalGames++;
            corpStat.totalScore += result.score;
            corpStat.bestScore = Math.max(corpStat.bestScore, result.score);
            corpStat.worstScore = Math.min(corpStat.worstScore, result.score);
            corpStat.players.add(result.playerName);

            // 순위별 카운트
            switch (result.rank) {
                case 1: corpStat.wins++; break;
                case 2: corpStat.seconds++; break;
                case 3: corpStat.thirds++; break;
            }
        });
    });

    // 평균 점수 계산
    Object.values(corporationStats).forEach(stat => {
        stat.averageScore = Math.round(stat.totalScore / stat.totalGames * 10) / 10;
        stat.winRate = Math.round((stat.wins / stat.totalGames) * 100);
        stat.playersCount = stat.players.size;
    });

    // 기업별 랭킹 정렬 (최소 플레이 수 필터링 후 게임 수 → 승률 → 평균 점수)
    const rankedCorporations = Object.entries(corporationStats)
        .filter(([, stats]) => stats.totalGames >= 3) // 최소 3게임 이상만 포함
        .sort((a, b) => {
            const [, statsA] = a;
            const [, statsB] = b;
            
            // 게임 수로 먼저 정렬 (많이 플레이한 기업 우선)
            if (statsA.totalGames !== statsB.totalGames) {
                return statsB.totalGames - statsA.totalGames;
            }
            // 승률로 정렬
            if (statsA.winRate !== statsB.winRate) {
                return statsB.winRate - statsA.winRate;
            }
            // 평균 점수로 정렬
            return statsB.averageScore - statsA.averageScore;
        });

    container.innerHTML = '';

    // 전체 통계 섹션
    const overallSection = document.createElement('div');
    overallSection.className = 'map-ranking-section';
    
    const overallTitle = document.createElement('div');
    overallTitle.className = 'map-title';
    overallTitle.innerHTML = '🏢 기업별 성과 분석 <small style="font-size: 0.8rem; color: #718096;">(최소 3게임 이상)</small>';

    const overallStats = document.createElement('div');
    overallStats.className = 'map-stats';
    overallStats.innerHTML = `
        <div class="map-stat-item">
            <div class="map-stat-label">총 기업 수</div>
            <div class="map-stat-value">${rankedCorporations.length}개</div>
        </div>
        <div class="map-stat-item">
            <div class="map-stat-label">총 게임 수</div>
            <div class="map-stat-value">${games.length}게임</div>
        </div>
        <div class="map-stat-item">
            <div class="map-stat-label">최고 승률</div>
            <div class="map-stat-value">${rankedCorporations.length > 0 ? rankedCorporations[0][1].winRate : 0}%</div>
        </div>
        <div class="map-stat-item">
            <div class="map-stat-label">최고 평균점수</div>
            <div class="map-stat-value">${rankedCorporations.length > 0 ? Math.max(...rankedCorporations.map(([,s]) => s.averageScore)) : 0}점</div>
        </div>
    `;

    overallSection.appendChild(overallTitle);
    overallSection.appendChild(overallStats);
    container.appendChild(overallSection);

    // 기업별 랭킹 테이블
    const rankingSection = document.createElement('div');

    // PC에서만 헤더 추가
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
        const header = document.createElement('div');
        header.className = 'ranking-item ranking-header-row';
        header.innerHTML = `
            <div class="rank-number"><strong>순위</strong></div>
            <div class="player-name"><strong>기업명</strong></div>
            <div class="stat"><strong>게임수</strong></div>
            <div class="stat"><strong>1등</strong></div>
            <div class="stat"><strong>승률</strong></div>
            <div class="stat"><strong>평균점수</strong></div>
        `;
        header.style.background = '#4a5568';
        header.style.color = 'white';
        header.style.marginBottom = '5px';
        rankingSection.appendChild(header);
    }

    rankedCorporations.forEach(([corporationName, stats], index) => {
        const rankingDiv = document.createElement('div');
        rankingDiv.className = 'ranking-item';
        
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
                <div class="player-name">${corporationName}<br><small>${stats.playersCount}명이 사용</small></div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">게임수</span>
                        <span class="stat-value">${stats.totalGames}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">1등</span>
                        <span class="stat-value">${stats.wins}회</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">승률</span>
                        <span class="stat-value">${stats.winRate}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">평균점수</span>
                        <span class="stat-value">${stats.averageScore}점</span>
                    </div>
                </div>
            `;
        } else {
            // PC: 테이블형 레이아웃
            rankingDiv.innerHTML = `
                <div class="rank-number">${index + 1}</div>
                <div class="player-name">${corporationName}<br><small>${stats.playersCount}명이 사용</small></div>
                <div class="stat">${stats.totalGames}</div>
                <div class="stat">${stats.wins}</div>
                <div class="stat">${stats.winRate}%</div>
                <div class="stat">${stats.averageScore}</div>
            `;
        }
        
        rankingSection.appendChild(rankingDiv);
    });

    container.appendChild(rankingSection);

    // 상세 통계 (상위 10개 기업만)
    if (rankedCorporations.length > 0) {
        const detailSection = document.createElement('div');
        detailSection.className = 'map-ranking-section';
        
        const detailTitle = document.createElement('div');
        detailTitle.className = 'map-title';
        detailTitle.innerHTML = '📊 상세 통계 (상위 기업)';

        const topCorporations = rankedCorporations.slice(0, 10);
        
        topCorporations.forEach(([corpName, stats]) => {
            const corpDetail = document.createElement('div');
            corpDetail.style.marginBottom = '15px';
            corpDetail.style.padding = '10px';
            corpDetail.style.background = 'white';
            corpDetail.style.borderRadius = '8px';
            corpDetail.style.borderLeft = '4px solid #667eea';
            
            corpDetail.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px; color: #2d3748;">${corpName}</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; font-size: 0.9rem;">
                    <div>게임: ${stats.totalGames}회</div>
                    <div>1등: ${stats.wins}회</div>
                    <div>2등: ${stats.seconds}회</div>
                    <div>3등: ${stats.thirds}회</div>
                    <div>승률: ${stats.winRate}%</div>
                    <div>평균: ${stats.averageScore}점</div>
                    <div>최고: ${stats.bestScore}점</div>
                    <div>최저: ${stats.worstScore === Infinity ? '-' : stats.worstScore}점</div>
                </div>
            `;
            
            detailSection.appendChild(corpDetail);
        });

        container.appendChild(detailSection);
    }
};
