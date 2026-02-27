// 맵별 랭킹 기능
TerraformingMarsTracker.prototype.updateMapRanking = function() {
    this.updateMapRankingForGames(this.games);
};

// 특정 게임 목록으로 맵별 랭킹 업데이트
TerraformingMarsTracker.prototype.updateMapRankingForGames = function(games) {
    const container = document.getElementById('map-ranking');
    
    if (games.length === 0) {
        container.innerHTML = '<p>해당 기간에 게임 기록이 없습니다.</p>';
        return;
    }

    // 맵별 통계 계산
    const mapStats = {};
    
    games.forEach(game => {
        if (!mapStats[game.map]) {
            mapStats[game.map] = {
                totalGames: 0,
                players: {},
                averageScore: 0,
                highestScore: 0,
                lowestScore: Infinity
            };
        }

        const mapStat = mapStats[game.map];
        mapStat.totalGames++;

        game.results.forEach(result => {
            if (!mapStat.players[result.playerName]) {
                mapStat.players[result.playerName] = {
                    games: 0,
                    totalScore: 0,
                    wins: 0,
                    seconds: 0,
                    thirds: 0,
                    averageScore: 0,
                    bestScore: 0,
                    worstScore: Infinity
                };
            }

            const playerStat = mapStat.players[result.playerName];
            playerStat.games++;
            playerStat.totalScore += result.score;
            playerStat.averageScore = Math.round(playerStat.totalScore / playerStat.games * 10) / 10;
            playerStat.bestScore = Math.max(playerStat.bestScore, result.score);
            playerStat.worstScore = Math.min(playerStat.worstScore, result.score);

            // 순위별 카운트
            switch (result.rank) {
                case 1: playerStat.wins++; break;
                case 2: playerStat.seconds++; break;
                case 3: playerStat.thirds++; break;
            }

            // 맵 전체 통계
            mapStat.highestScore = Math.max(mapStat.highestScore, result.score);
            mapStat.lowestScore = Math.min(mapStat.lowestScore, result.score);
        });

        // 맵 평균 점수 계산
        const totalScores = game.results.reduce((sum, r) => sum + r.score, 0);
        mapStat.averageScore = Math.round(totalScores / game.results.length * 10) / 10;
    });

    container.innerHTML = '';

    // 맵별로 표시
    Object.entries(mapStats).forEach(([mapName, stats]) => {
        const mapSection = document.createElement('div');
        mapSection.className = 'map-ranking-section';

        // 맵 제목과 전체 통계
        const mapTitle = document.createElement('div');
        mapTitle.className = 'map-title';
        mapTitle.innerHTML = `🗺️ ${mapName}`;

        const mapOverallStats = document.createElement('div');
        mapOverallStats.className = 'map-stats';
        mapOverallStats.innerHTML = `
            <div class="map-stat-item">
                <div class="map-stat-label">총 게임 수</div>
                <div class="map-stat-value">${stats.totalGames}게임</div>
            </div>
            <div class="map-stat-item">
                <div class="map-stat-label">평균 점수</div>
                <div class="map-stat-value">${stats.averageScore}점</div>
            </div>
            <div class="map-stat-item">
                <div class="map-stat-label">최고 점수</div>
                <div class="map-stat-value">${stats.highestScore}점</div>
            </div>
            <div class="map-stat-item">
                <div class="map-stat-label">최저 점수</div>
                <div class="map-stat-value">${stats.lowestScore === Infinity ? '-' : stats.lowestScore}점</div>
            </div>
        `;

        // 플레이어별 맵 랭킹
        const playerRanking = Object.entries(stats.players)
            .sort((a, b) => {
                // 승률로 먼저 정렬
                const winRateA = a[1].wins / a[1].games;
                const winRateB = b[1].wins / b[1].games;
                if (winRateA !== winRateB) {
                    return winRateB - winRateA;
                }
                // 평균 점수로 정렬
                return b[1].averageScore - a[1].averageScore;
            });

        const rankingContainer = document.createElement('div');

        // PC에서만 헤더 추가
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            const header = document.createElement('div');
            header.className = 'ranking-item ranking-header-row';
            header.innerHTML = `
                <div class="rank-number"><strong>순위</strong></div>
                <div class="player-name"><strong>플레이어</strong></div>
                <div class="stat"><strong>게임수</strong></div>
                <div class="stat"><strong>1등</strong></div>
                <div class="stat"><strong>승률</strong></div>
                <div class="stat"><strong>평균점수</strong></div>
            `;
            header.style.background = '#4a5568';
            header.style.color = 'white';
            header.style.marginBottom = '5px';
            rankingContainer.appendChild(header);
        }

        playerRanking.forEach(([playerName, playerStats], index) => {
            const winRate = Math.round((playerStats.wins / playerStats.games) * 100);
            
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
                    <div class="player-name">${playerName}</div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">게임수</span>
                            <span class="stat-value">${playerStats.games}회</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">1등</span>
                            <span class="stat-value">${playerStats.wins}회</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">승률</span>
                            <span class="stat-value">${winRate}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">평균점수</span>
                            <span class="stat-value">${playerStats.averageScore}점</span>
                        </div>
                    </div>
                `;
            } else {
                // PC: 테이블형 레이아웃
                rankingDiv.innerHTML = `
                    <div class="rank-number">${index + 1}</div>
                    <div class="player-name">${playerName}</div>
                    <div class="stat">${playerStats.games}</div>
                    <div class="stat">${playerStats.wins}</div>
                    <div class="stat">${winRate}%</div>
                    <div class="stat">${playerStats.averageScore}</div>
                `;
            }
            
            rankingContainer.appendChild(rankingDiv);
        });

        mapSection.appendChild(mapTitle);
        mapSection.appendChild(mapOverallStats);
        mapSection.appendChild(rankingContainer);
        container.appendChild(mapSection);
    });
};
