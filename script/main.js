// 테라포밍 마스 점수 관리 메인 클래스
class TerraformingMarsTracker {
    constructor() {
        this.players = [];
        this.games = [];
        this.currentPlayerCount = 3;
        this.corporations = [
            'Aphrodite',
            'Arcadian Communities',
            'Aridor',
            'Arklight',
            'Astrodrill Enterprise',
            'Celestic',
            'Cheung Shing Mars',
            'Credicor',
            'Ecoline',
            'Ecotec',
            'Factorum',
            'Helion',
            'Interplanetary Cinematics',
            'Inventrix',
            'Kuiper Cooperative',
            'Lakefront Resorts',
            'Manutech',
            'Mining Guild',
            'Mons Insurance',
            'MSI',
            'Nirgal Enterprises',
            'Palladin Shipping',
            'Pharmacy Union',
            'Philares',
            'Phoblog',
            'Point Luna',
            'Polyphemos',
            'Poseidon',
            'Pristar',
            'Recyclon',
            'Robinson Industries',
            'Sagitta Frontier Services',
            'Saturn Systems',
            'Septem Tribus',
            'Spire',
            'Splice',
            'Stormcraft',
            'Teractor',
            'Terralabs',
            'Tharsis Republic',
            'Thorgate',
            'Tycho Magnetics',
            'UNMI',
            'Utopia Invest',
            'Valley Trust',
            'Viron',
            'Vitor'
        ];
        
        this.initializeEventListeners();
        this.generatePlayerInputs();
        
        // 스와이프 기능 추가
        this.initializeSwipe();
        
        // 동기화 초기화
        this.initializeSync();
        
        // 초기 데이터 로드
        this.loadData();
        
        // 저장된 맵 선택 복원
        if (this.selectedMap) {
            const mapSelect = document.getElementById('mapSelect');
            if (mapSelect) {
                mapSelect.value = this.selectedMap;
                // 맵 표시도 업데이트
                if (typeof this.updateSelectedMapDisplay === 'function') {
                    this.updateSelectedMapDisplay(this.selectedMap);
                }
            }
        }
        
        // 초기 UI 업데이트
        this.updateRanking();
        this.updateHistory();
    }

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 플레이어 수 변경
        document.getElementById('playerCount').addEventListener('change', (e) => {
            this.currentPlayerCount = parseInt(e.target.value);
            this.generatePlayerInputs();
        });

        // 플레이어 설정 완료
        document.getElementById('setupPlayers').addEventListener('click', () => {
            this.setupPlayers();
        });

        // 게임 결과 추가
        document.getElementById('addGame').addEventListener('click', () => {
            this.addGame();
        });

        // 플레이어 재설정
        document.getElementById('resetPlayers').addEventListener('click', () => {
            this.resetPlayers();
        });

        // 데이터 내보내기 (레거시 저장)
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // 데이터 가져오기
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importData').click();
        });

        document.getElementById('importData').addEventListener('change', (e) => {
            this.importData(e);
        });
        
        // 순서 정하기
        document.getElementById('randomizeOrder').addEventListener('click', () => {
            this.randomizePlayerOrder();
        });
        
        // 개척기지 뽑기
        document.getElementById('randomizeColonies').addEventListener('click', () => {
            console.log('개척기지 뽑기 버튼 클릭됨');
            if (typeof this.randomizeColonies === 'function') {
                this.randomizeColonies();
            } else {
                console.error('randomizeColonies 함수가 정의되지 않았습니다');
                alert('개척기지 뽑기 기능을 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
            }
        });
        
        // 맵 랜덤 선택
        document.getElementById('randomizeMap').addEventListener('click', () => {
            console.log('맵 랜덤 선택 버튼 클릭됨');
            if (typeof this.randomizeMap === 'function') {
                this.randomizeMap();
            } else {
                console.error('randomizeMap 함수가 정의되지 않았습니다');
                alert('맵 랜덤 선택 기능을 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
            }
        });
        
        // 맵 선택 동기화
        document.getElementById('mapSelect').addEventListener('change', (e) => {
            const selectedMap = e.target.value;
            console.log('맵 선택 변경:', selectedMap);
            
            // 선택된 맵 저장
            this.selectedMap = selectedMap;
            
            // 서버로 맵 선택 동기화
            this.syncToServer('updateSelectedMap', {
                selectedMap: selectedMap
            });
            
            // 로컬 스토리지도 업데이트
            this.saveData();
        });
        
        // 전역 함수로 통계 재계산 함수 노출 (디버깅용)
        window.recalculateStats = () => {
            this.recalculateAllStats();
            this.updateRanking();
            this.updateHistory();
            console.log('통계 재계산 완료');
        };
        
        // 전역 함수로 개척기지 뽑기 함수 노출 (디버깅용)
        window.testColonies = () => {
            if (typeof this.randomizeColonies === 'function') {
                this.randomizeColonies();
            } else {
                console.error('randomizeColonies 함수가 없습니다');
            }
        };
        
        // 전역 함수로 순서 관련 함수 노출 (디버깅용)
        window.testOrder = () => {
            this.randomizePlayerOrder();
        };
        
        window.resetOrder = () => {
            this.resetPlayerOrder();
        };
        
        window.showOrder = () => {
            this.updateGameInputsWithOrder();
        };
        
        window.rearrangePlayers = () => {
            this.rearrangePlayersByOrder();
        };
        
        window.testMapRandom = () => {
            this.randomizeMap();
        };

        // 랭킹 탭 이벤트
        document.getElementById('playerRankingTab').addEventListener('click', () => {
            this.showPlayerRanking();
        });

        document.getElementById('corporationRankingTab').addEventListener('click', () => {
            this.showCorporationRanking();
        });

        document.getElementById('mapRankingTab').addEventListener('click', () => {
            this.showMapRanking();
        });

        // 스와이프 기능 추가
        this.initializeSwipe();
    }
}

// 전역 인스턴스 생성
let tmTracker;

// DOM이 로드되면 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    tmTracker = new TerraformingMarsTracker();
});
