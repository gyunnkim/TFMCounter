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
                <span>📊 총 ${this.games.length}게임</span>
                <span>📅 ${this.getDateRange()}</span>
            </div>
            <button onclick="tmTracker.exportHistoryData()" class="btn btn-success" style="padding: 8px 16px; font-size: 0.9rem;">
                📁 히스토리 내보내기
            </button>
        `;
        container.appendChild(headerDiv);
    }

    // 최신 게임부터 표시
    [...this.games].reverse().forEach(game => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-history';

        const header = document.createElement('div');
        header.className = 'game-header';
        header.innerHTML = `
            <span>📅 ${game.date} - 🗺️ ${game.map}</span>
            <button onclick="tmTracker.deleteGame(${game.id})" class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;">삭제</button>
        `;

        const results = document.createElement('div');
        results.className = 'game-results';

        game.results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'player-result';
            if (result.rank === 1) resultDiv.classList.add('winner');

            // 큐브 색상에 따른 이미지 결정
            const cubeIcon = result.cubeColor ? `img/${result.cubeColor}-square.svg` : 'img/black-square.svg';

            resultDiv.innerHTML = `
                <div><strong>${result.rank}등</strong></div>
                <div class="player-info">
                    <img src="${cubeIcon}" alt="${result.cubeColor} 큐브" class="cube-icon-small" style="width: 16px; height: 16px; margin-right: 4px;">
                    ${result.playerName}
                </div>
                <div>(${result.corporation})</div>
                <div>점수: ${result.score}</div>
                <div>💰 ${result.megacredits}</div>
            `;
            results.appendChild(resultDiv);
        });

        gameDiv.appendChild(header);
        gameDiv.appendChild(results);
        container.appendChild(gameDiv);
    });
};

// 날짜 범위 계산
TerraformingMarsTracker.prototype.getDateRange = function() {
    if (this.games.length === 0) return '';
    
    const dates = this.games.map(game => new Date(game.date)).sort((a, b) => a - b);
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

