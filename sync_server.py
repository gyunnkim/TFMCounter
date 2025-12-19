#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import threading
import time
import signal
import sys
from urllib.parse import urlparse, parse_qs
from datetime import datetime

class ReusableTCPServer(socketserver.TCPServer):
    """포트 재사용이 가능한 TCP 서버"""
    allow_reuse_address = True
    
    def server_bind(self):
        """소켓 옵션 설정 후 바인딩"""
        import socket
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        super().server_bind()

class SyncHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.data_dir = 'data'
        self.data_file = os.path.join(self.data_dir, 'game_data.json')
        self.backup_dir = os.path.join(self.data_dir, 'backups')
        
        # 디렉토리 생성
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
        
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        if self.path == '/api/data':
            self.handle_get_data()
        elif self.path.startswith('/api/sync'):
            self.handle_sync_check()
        elif self.path == '/api/recalculate':
            self.handle_recalculate()
        elif self.path == '/api/export':
            self.handle_export()
        else:
            super().do_GET()  # 정적 파일 서빙
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/data':
            self.handle_post_data()
        else:
            self.send_error(404)
    
    def handle_get_data(self):
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                data = {'players': [], 'games': [], 'lastUpdated': datetime.now().isoformat()}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))
    
    def handle_post_data(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # 타임스탬프 추가
            data['lastUpdated'] = datetime.now().isoformat()
            
            # 기존 데이터가 있으면 백업 생성
            if os.path.exists(self.data_file):
                self.create_backup()
            
            # 데이터 저장
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # 개별 게임 파일 저장 비활성화 (통합 파일만 사용)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'success': True, 
                'message': 'Data updated',
                'lastUpdated': data['lastUpdated'],
                'totalGames': len(data.get('games', [])),
                'totalPlayers': len(data.get('players', []))
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))
    
    def handle_sync_check(self):
        try:
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            client_timestamp = query_params.get('timestamp', [None])[0]
            
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                server_timestamp = data.get('lastUpdated', '')
                
                # 클라이언트 타임스탬프와 서버 타임스탬프 비교
                needs_update = client_timestamp != server_timestamp
                
                response = {
                    'needsUpdate': needs_update,
                    'serverTimestamp': server_timestamp,
                    'data': data if needs_update else None
                }
            else:
                response = {
                    'needsUpdate': False,
                    'serverTimestamp': datetime.now().isoformat(),
                    'data': None
                }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def create_backup(self):
        """기존 데이터 파일의 백업 생성"""
        try:
            if os.path.exists(self.data_file):
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_file = os.path.join(self.backup_dir, f'game_data_backup_{timestamp}.json')
                
                with open(self.data_file, 'r', encoding='utf-8') as src:
                    with open(backup_file, 'w', encoding='utf-8') as dst:
                        dst.write(src.read())
                
                print(f"백업 생성: {backup_file}")
                
                # 오래된 백업 파일 정리 (최근 10개만 유지)
                self.cleanup_old_backups()
        except Exception as e:
            print(f"백업 생성 중 오류: {e}")
    
    def cleanup_old_backups(self):
        """오래된 백업 파일 정리"""
        try:
            backup_files = []
            for file in os.listdir(self.backup_dir):
                if file.startswith('game_data_backup_') and file.endswith('.json'):
                    file_path = os.path.join(self.backup_dir, file)
                    backup_files.append((file_path, os.path.getctime(file_path)))
            
            # 생성 시간 순으로 정렬
            backup_files.sort(key=lambda x: x[1], reverse=True)
            
            # 최근 10개를 제외하고 삭제
            for file_path, _ in backup_files[10:]:
                os.remove(file_path)
                print(f"오래된 백업 삭제: {file_path}")
        except Exception as e:
            print(f"백업 정리 중 오류: {e}")
    
    def handle_sync(self):
        """동기화 상태 확인"""
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'connected',
                'timestamp': datetime.now().isoformat(),
                'message': '동기화 연결됨'
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"동기화 확인 중 오류: {e}")
            self.send_error(500, str(e))
    
    def handle_recalculate(self):
        """플레이어 통계 재계산"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # 플레이어 통계 초기화
                for player in data.get('players', []):
                    player['games'] = []
                    player['stats'] = {
                        'totalGames': 0,
                        'totalScore': 0,
                        'averageScore': 0,
                        'wins': 0,
                        'seconds': 0,
                        'thirds': 0,
                        'fourths': 0
                    }
                
                # 게임 데이터로부터 통계 재계산
                for game in data.get('games', []):
                    for result in game.get('results', []):
                        # 플레이어 이름으로 찾기
                        player = None
                        for p in data['players']:
                            if p['name'] == result['playerName']:
                                player = p
                                break
                        
                        if player:
                            player['games'].append(result)
                            player['stats']['totalGames'] += 1
                            player['stats']['totalScore'] += result['score']
                            
                            # 순위별 카운트
                            if result['rank'] == 1:
                                player['stats']['wins'] += 1
                            elif result['rank'] == 2:
                                player['stats']['seconds'] += 1
                            elif result['rank'] == 3:
                                player['stats']['thirds'] += 1
                            elif result['rank'] == 4:
                                player['stats']['fourths'] += 1
                
                # 평균 점수 계산
                for player in data['players']:
                    if player['stats']['totalGames'] > 0:
                        player['stats']['averageScore'] = round(
                            player['stats']['totalScore'] / player['stats']['totalGames'], 1
                        )
                
                # 업데이트된 데이터 저장
                data['lastUpdated'] = datetime.now().isoformat()
                with open(self.data_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    'success': True,
                    'message': '통계 재계산 완료',
                    'players': len(data['players']),
                    'games': len(data['games'])
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print("플레이어 통계 재계산 완료")
                
            else:
                self.send_error(404, "데이터 파일을 찾을 수 없습니다")
                
        except Exception as e:
            print(f"통계 재계산 중 오류: {e}")
            self.send_error(500, str(e))
    
    def handle_export(self):
        """데이터를 games 디렉토리에 내보내기"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # 게임 날짜 범위 계산
                games = data.get('games', [])
                if not games:
                    self.send_error(400, "내보낼 게임 데이터가 없습니다")
                    return
                
                game_dates = [game['date'] for game in games]
                game_dates.sort()
                
                # 날짜 형식 변환 (YYYYMMDD)
                def format_date_for_filename(date_str):
                    # "2019. 02. 22." 형식을 "20190222"로 변환
                    import re
                    numbers = re.findall(r'\d+', date_str)
                    if len(numbers) >= 3:
                        year = numbers[0].zfill(4)
                        month = numbers[1].zfill(2)
                        day = numbers[2].zfill(2)
                        return f"{year}{month}{day}"
                    return "unknown"
                
                first_date = format_date_for_filename(game_dates[0])
                last_date = format_date_for_filename(game_dates[-1])
                
                date_range = first_date if len(games) == 1 else f"{first_date}-{last_date}"
                
                # 레거시 데이터 생성
                legacy_data = {
                    'players': data.get('players', []),
                    'games': games,
                    'exportDate': datetime.now().isoformat(),
                    'version': '1.0',
                    'description': '테라포밍 마스 레거시 데이터',
                    'gameCount': len(games),
                    'dateRange': {
                        'start': game_dates[0],
                        'end': game_dates[-1]
                    }
                }
                
                # games 디렉토리에 파일 저장
                games_dir = os.path.join(self.data_dir, 'games')
                os.makedirs(games_dir, exist_ok=True)
                
                filename = f"terraforming_mars_legacy_{date_range}.json"
                export_path = os.path.join(games_dir, filename)
                
                with open(export_path, 'w', encoding='utf-8') as f:
                    json.dump(legacy_data, f, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    'success': True,
                    'message': f'데이터가 games 디렉토리에 저장되었습니다',
                    'filename': filename,
                    'path': export_path,
                    'gameCount': len(games),
                    'dateRange': date_range
                }
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                print(f"레거시 데이터 내보내기 완료: {export_path}")
                
            else:
                self.send_error(404, "데이터 파일을 찾을 수 없습니다")
                
        except Exception as e:
            print(f"데이터 내보내기 중 오류: {e}")
            self.send_error(500, str(e))
    

def signal_handler(signum, frame):
    """Graceful shutdown을 위한 시그널 핸들러"""
    print(f"\n🛑 서버 종료 신호 수신 (Signal: {signum})")
    print("📝 서버를 안전하게 종료합니다...")
    sys.exit(0)

if __name__ == "__main__":
    PORT = 3010
    
    # 시그널 핸들러 등록 (Ctrl+C, 종료 시그널 처리)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # 포트 재사용이 가능한 서버 사용
        with ReusableTCPServer(("0.0.0.0", PORT), SyncHTTPRequestHandler) as httpd:
            print(f"🚀 테라포밍 마스 동기화 서버가 시작되었습니다!")
            print(f"📱 로컬 접속: http://localhost:{PORT}")
            print(f"🌐 네트워크 접속: http://172.30.1.30:{PORT}")
            print(f"⚡ 실시간 동기화 활성화됨")
            print(f"🔄 포트 재사용 활성화됨")
            print(f"💡 서버 종료: Ctrl+C")
            
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 포트 {PORT}가 이미 사용 중입니다.")
            print(f"🔧 해결 방법:")
            print(f"   1. 기존 프로세스 종료: lsof -ti:{PORT} | xargs kill -9")
            print(f"   2. 잠시 후 다시 시도")
        else:
            print(f"❌ 서버 시작 오류: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n🛑 사용자에 의해 서버가 종료되었습니다.")
        sys.exit(0)
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        sys.exit(1)
