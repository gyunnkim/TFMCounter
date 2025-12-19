#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from collections import defaultdict, Counter

def analyze_legacy_data():
    """레거시 데이터 분석 및 랭킹 생성"""
    
    # 레거시 데이터 로드
    with open('/Users/kihokim/Documents/TFMCounter/terraforming_mars_legacy_2019-2022.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    players = data['players']
    games = data['games']
    
    print("🏆 테라포밍 마스 레거시 데이터 분석 (2019-2022)")
    print("=" * 60)
    
    # 1. 플레이어 랭킹
    print("\n👥 역대 플레이어 랭킹")
    print("-" * 40)
    
    # 승률 기준 정렬
    player_rankings = []
    for player in players:
        stats = player['stats']
        win_rate = (stats['wins'] / stats['totalGames'] * 100) if stats['totalGames'] > 0 else 0
        
        player_rankings.append({
            'name': player['name'],
            'games': stats['totalGames'],
            'wins': stats['wins'],
            'seconds': stats['seconds'],
            'thirds': stats['thirds'],
            'win_rate': round(win_rate, 1),
            'avg_score': stats['averageScore']
        })
    
    # 승수 -> 승률 -> 평균점수 순으로 정렬
    player_rankings.sort(key=lambda x: (x['wins'], x['win_rate'], x['avg_score']), reverse=True)
    
    for i, player in enumerate(player_rankings, 1):
        print(f"{i:2d}. {player['name']:8s} | "
              f"{player['games']:3d}게임 | "
              f"{player['wins']:2d}승 {player['seconds']:2d}준 {player['thirds']:2d}삼 | "
              f"승률 {player['win_rate']:5.1f}% | "
              f"평균 {player['avg_score']:5.1f}점")
    
    # 2. 기업별 랭킹
    print("\n🏢 역대 기업별 랭킹")
    print("-" * 40)
    
    corp_stats = defaultdict(lambda: {
        'games': 0, 'wins': 0, 'total_score': 0, 'players': set()
    })
    
    for game in games:
        for result in game['results']:
            corp = result['corporation'].upper().strip()
            if corp and corp != 'NONE':
                corp_stats[corp]['games'] += 1
                corp_stats[corp]['total_score'] += result['score']
                corp_stats[corp]['players'].add(result['playerName'])
                if result['rank'] == 1:
                    corp_stats[corp]['wins'] += 1
    
    # 기업 랭킹 계산
    corp_rankings = []
    for corp, stats in corp_stats.items():
        if stats['games'] >= 3:  # 최소 3게임 이상
            win_rate = (stats['wins'] / stats['games'] * 100)
            avg_score = stats['total_score'] / stats['games']
            
            corp_rankings.append({
                'name': corp,
                'games': stats['games'],
                'wins': stats['wins'],
                'win_rate': round(win_rate, 1),
                'avg_score': round(avg_score, 1),
                'players_count': len(stats['players'])
            })
    
    # 승률 -> 평균점수 순으로 정렬
    corp_rankings.sort(key=lambda x: (x['win_rate'], x['avg_score']), reverse=True)
    
    for i, corp in enumerate(corp_rankings[:15], 1):  # 상위 15개만
        print(f"{i:2d}. {corp['name']:20s} | "
              f"{corp['games']:3d}게임 | "
              f"{corp['wins']:2d}승 | "
              f"승률 {corp['win_rate']:5.1f}% | "
              f"평균 {corp['avg_score']:5.1f}점 | "
              f"{corp['players_count']}명 사용")
    
    # 3. 맵별 랭킹
    print("\n🗺️  역대 맵별 플레이어 랭킹")
    print("-" * 40)
    
    map_player_stats = defaultdict(lambda: defaultdict(lambda: {
        'games': 0, 'wins': 0, 'total_score': 0
    }))
    
    for game in games:
        map_name = game['map']
        for result in game['results']:
            player = result['playerName']
            map_player_stats[map_name][player]['games'] += 1
            map_player_stats[map_name][player]['total_score'] += result['score']
            if result['rank'] == 1:
                map_player_stats[map_name][player]['wins'] += 1
    
    for map_name, player_stats in map_player_stats.items():
        print(f"\n📍 {map_name}")
        
        map_rankings = []
        for player, stats in player_stats.items():
            if stats['games'] >= 2:  # 최소 2게임 이상
                win_rate = (stats['wins'] / stats['games'] * 100)
                avg_score = stats['total_score'] / stats['games']
                
                map_rankings.append({
                    'name': player,
                    'games': stats['games'],
                    'wins': stats['wins'],
                    'win_rate': round(win_rate, 1),
                    'avg_score': round(avg_score, 1)
                })
        
        map_rankings.sort(key=lambda x: (x['wins'], x['win_rate'], x['avg_score']), reverse=True)
        
        for i, player in enumerate(map_rankings, 1):
            print(f"   {i}. {player['name']:8s} | "
                  f"{player['games']:2d}게임 | "
                  f"{player['wins']:2d}승 | "
                  f"승률 {player['win_rate']:5.1f}% | "
                  f"평균 {player['avg_score']:5.1f}점")
    
    # 4. 연도별 통계
    print("\n📅 연도별 통계")
    print("-" * 40)
    
    year_stats = defaultdict(lambda: {'games': 0, 'players': set()})
    
    for game in games:
        year = game.get('year', 2019)
        year_stats[year]['games'] += 1
        for result in game['results']:
            year_stats[year]['players'].add(result['playerName'])
    
    for year in sorted(year_stats.keys()):
        stats = year_stats[year]
        print(f"{year}년: {stats['games']:2d}게임, {len(stats['players'])}명 참여")
    
    # 5. 흥미로운 통계
    print("\n📊 흥미로운 통계")
    print("-" * 40)
    
    # 최고점수
    highest_score = max(games, key=lambda g: max(r['score'] for r in g['results']))
    best_result = max(highest_score['results'], key=lambda r: r['score'])
    print(f"🎯 최고점수: {best_result['score']}점 - {best_result['playerName']} ({best_result['corporation']})")
    
    # 최저점수
    lowest_score = min(games, key=lambda g: min(r['score'] for r in g['results']))
    worst_result = min(lowest_score['results'], key=lambda r: r['score'])
    print(f"😅 최저점수: {worst_result['score']}점 - {worst_result['playerName']} ({worst_result['corporation']})")
    
    # 가장 많이 사용된 기업
    corp_usage = Counter()
    for game in games:
        for result in game['results']:
            corp = result['corporation'].upper().strip()
            if corp and corp != 'NONE':
                corp_usage[corp] += 1
    
    most_used_corp = corp_usage.most_common(1)[0]
    print(f"🏢 최다 사용 기업: {most_used_corp[0]} ({most_used_corp[1]}회)")
    
    # 가장 많이 플레이된 맵
    map_usage = Counter(game['map'] for game in games)
    most_played_map = map_usage.most_common(1)[0]
    print(f"🗺️  최다 플레이 맵: {most_played_map[0]} ({most_played_map[1]}게임)")
    
    print(f"\n✅ 총 {len(games)}게임, {len(players)}명의 플레이어 데이터 분석 완료!")

if __name__ == "__main__":
    analyze_legacy_data()
