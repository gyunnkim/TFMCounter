// UI 인터랙션 관리 기능
TerraformingMarsTracker.prototype.initializeSwipe = function() {
    const rankingContent = document.querySelector('.ranking-content');
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    rankingContent.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    rankingContent.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
    });

    rankingContent.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        const diffX = startX - currentX;
        const threshold = 50; // 최소 스와이프 거리

        if (Math.abs(diffX) > threshold) {
            const isPlayerRankingActive = document.getElementById('player-ranking').classList.contains('active');
            const isCorporationRankingActive = document.getElementById('corporation-ranking').classList.contains('active');
            const isMapRankingActive = document.getElementById('map-ranking').classList.contains('active');
            
            if (diffX > 0) {
                // 왼쪽으로 스와이프
                if (isPlayerRankingActive) {
                    this.showCorporationRanking();
                } else if (isCorporationRankingActive) {
                    this.showMapRanking();
                }
            } else if (diffX < 0) {
                // 오른쪽으로 스와이프
                if (isMapRankingActive) {
                    this.showCorporationRanking();
                } else if (isCorporationRankingActive) {
                    this.showPlayerRanking();
                }
            }
        }
    });

    // 마우스 이벤트도 추가 (데스크톱용)
    rankingContent.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isDragging = true;
        e.preventDefault();
    });

    rankingContent.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
    });

    rankingContent.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;

        const diffX = startX - currentX;
        const threshold = 50;

        if (Math.abs(diffX) > threshold) {
            const isPlayerRankingActive = document.getElementById('player-ranking').classList.contains('active');
            const isCorporationRankingActive = document.getElementById('corporation-ranking').classList.contains('active');
            const isMapRankingActive = document.getElementById('map-ranking').classList.contains('active');
            
            if (diffX > 0) {
                // 왼쪽으로 스와이프
                if (isPlayerRankingActive) {
                    this.showCorporationRanking();
                } else if (isCorporationRankingActive) {
                    this.showMapRanking();
                }
            } else if (diffX < 0) {
                // 오른쪽으로 스와이프
                if (isMapRankingActive) {
                    this.showCorporationRanking();
                } else if (isCorporationRankingActive) {
                    this.showPlayerRanking();
                }
            }
        }
    });

    rankingContent.addEventListener('mouseleave', () => {
        isDragging = false;
    });
};
