"""Maintain a bounded, cached OSM place library; no API requests from the app.

Python standard library only. See docs/place-library-sources.md for scope and ODbL.
"""
import argparse
import datetime as dt
import hashlib
import json
import math
import pathlib
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'data/place-expansion/osm-places.json'
CACHE = ROOT / 'artifacts/place-library-cache'
LICENSE = 'https://opendatacommons.org/licenses/odbl/1-0/'
USER_AGENT = 'TusuanPlaceLibrary/1.0 (+https://github.com/ducky-yyds/tour-fee; cached editorial collection)'
QUERY_VERSION = 2
# Editorial equivalence for an OSM name and the already maintained destination.
# It is city-scoped and still requires coordinates within 180 metres.
KNOWN_NAME_ALIASES = {'hong-kong': {'goldfishstreet': 'goldfishmarket'}}
GENERIC_NAMES = {
    'market', 'fruitmarket', 'clothingmarket', 'shoppingmall', 'park', 'garden',
    'viewpoint', 'museum', 'attraction', 'shop', 'retail', 'departmentstore',
    '市场', '水果市场', '服装市场', '零售店', '商店', '公园', '花园', '观景点', '博物馆', '景点', '购物中心',
}


def read(path, fallback=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else fallback


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')


def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value or '').casefold()
                   if c.isalnum())


def identity_name(value):
    # Small, conservative suffix vocabulary handles Louvre / Louvre Palace /
    # 卢浮宫博物馆 without treating the neighboring Louvre Carousel as the same place.
    value = re.sub(r'\b(the|museum|palace|cathedral|musée|musee|palais|of|du|de|la|le)\b', ' ', value or '', flags=re.I)
    value = re.sub(r'(博物馆|大教堂|宫殿|旧址)$', '', value)
    return normalize(value)


def distance(a, b):
    lat1, lat2 = math.radians(a['lat']), math.radians(b['lat'])
    dlat = lat2 - lat1
    dlng = math.radians(b['lng'] - a['lng'])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def cities():
    merged = {c['id']: c for c in read(ROOT / 'data/cities.json', [])}
    for file in sorted((ROOT / 'data/expansion').glob('*.json')):
        for city in read(file, []):
            old = merged.get(city['id'], {})
            sights = {a['id']: a for a in old.get('attractions', [])}
            sights.update({a['id']: a for a in city.get('attractions', [])})
            merged[city['id']] = {**old, **city, 'attractions': list(sights.values())}
    for file in sorted((ROOT / 'data/place-expansion').glob('*.json')):
        if file.name == OUTPUT.name:
            continue
        for item in read(file, []):
            if item['cityId'] in merged:
                merged[item['cityId']].setdefault('attractions', []).extend(item.get('attractions', []))
    return [c for c in merged.values() if c.get('coverage') != 'airport-only'
            and isinstance(c.get('lat'), (int, float)) and isinstance(c.get('lng'), (int, float))]


def query(city, radius):
    lat_delta = radius / 111320
    lng_delta = radius / (111320 * max(.1, math.cos(math.radians(city['lat']))))
    around = f"({city['lat']-lat_delta:.6f},{city['lng']-lng_delta:.6f},{city['lat']+lat_delta:.6f},{city['lng']+lng_delta:.6f})"
    filters = [
        '[place~"^(neighbourhood|quarter|suburb|square)$"]',
        '[amenity=marketplace]', '[leisure~"^(park|garden)$"]',
        '[tourism~"^(attraction|museum|gallery|viewpoint)$"]',
        '[historic~"^(castle|monument|archaeological_site|city_gate)$"]',
        '[shop~"^(mall|department_store)$"]', '[highway=pedestrian]',
    ]
    return '[out:json][timeout:30][maxsize:67108864];(' + ''.join(
        f'nwr{around}{f}[name];' for f in filters) + ');out center tags;'


def category(tags):
    if tags.get('place') in ('neighbourhood', 'quarter', 'suburb'):
        return '街区漫游', 'neighborhood', 90, '街区', True
    if tags.get('place') == 'square' or tags.get('highway') == 'pedestrian':
        return '街巷与广场', 'neighborhood', 45, '公共街巷或广场', True
    if tags.get('amenity') == 'marketplace':
        return '市场与日常', 'neighborhood', 60, '市场', False
    if tags.get('leisure') in ('park', 'garden'):
        return '公园与花园', 'optional', 90, '公园或花园', False
    if tags.get('shop') in ('mall', 'department_store'):
        return '商业街区', 'optional', 60, '购物场所', False
    if tags.get('tourism') in ('museum', 'gallery'):
        return '博物馆与艺术', 'optional', 90, '博物馆或艺术空间', False
    if tags.get('historic'):
        return '历史与文化', 'optional', 60, '历史文化地点', False
    if tags.get('tourism') == 'viewpoint':
        return '城市与自然视野', 'optional', 45, '观景点', False
    return '当地探索', 'optional', 60, '游览地点', False


def wiki_article(tags):
    wiki = tags.get('wikipedia', '')
    if wiki.startswith('en:') and len(wiki) > 3:
        return wiki[3:].split('#', 1)[0].replace('_', ' ').strip()
    return tags.get('wikipedia:en', '').removeprefix('en:').split('#', 1)[0].replace('_', ' ').strip()


def official_url(tags):
    candidate = tags.get('website') or tags.get('contact:website') or ''
    if candidate.startswith(('http://', 'https://')):
        return candidate.split(';')[0]
    return None


def eligible(element):
    tags = element.get('tags', {})
    if not tags.get('name') or len(tags['name'].strip()) < 2:
        return False
    source_names = {normalize(tags.get(k)) for k in ('name', 'name:en', 'name:zh', 'name:zh-Hans') if tags.get(k)}
    if source_names and source_names.issubset(GENERIC_NAMES):
        return False
    for key in ('access', 'foot', 'tourism:access'):
        if tags.get(key, '').lower() in ('private', 'no', 'customers', 'permit', 'military'):
            return False
    if any(tags.get(k, '').lower() in ('yes', 'true', '1') for k in ('disused', 'abandoned', 'demolished', 'ruins')):
        return False
    if any(k.startswith(('disused:', 'abandoned:', 'demolished:', 'proposed:', 'construction:')) for k in tags):
        return False
    return tags.get('opening_hours', '').strip().lower() not in ('closed', 'off', '24/7 off')


def transform(city, raw, radius, cap):
    old = [a for a in city.get('attractions', []) if a.get('sourceProvider') != 'openstreetmap']
    old_names = {normalize(a.get(k)) for a in old for k in ('name', 'nameEn') if a.get(k)}
    old_articles = {normalize(a.get('article')) for a in old if a.get('article')}
    candidates = []
    for element in raw.get('elements', []):
        if not eligible(element):
            continue
        tags = element['tags']
        point = element.get('center', element)
        if 'lat' not in point or 'lon' not in point:
            continue
        pos = {'lat': point['lat'], 'lng': point['lon']}
        km = distance(city, pos)
        if km > radius / 1000:
            continue
        names = {normalize(tags.get(k)) for k in ('name', 'name:en', 'name:zh', 'name:zh-Hans') if tags.get(k)}
        article = wiki_article(tags)
        if names & old_names or (article and normalize(article) in old_articles | old_names):
            continue
        aliases = {KNOWN_NAME_ALIASES.get(city['id'], {}).get(n) for n in names} - {None}
        if aliases and any(isinstance(a.get('lat'), (int, float)) and isinstance(a.get('lng'), (int, float))
                           and distance(pos, a) < .18
                           and aliases.intersection({normalize(a.get('name')), normalize(a.get('nameEn'))}) for a in old):
            continue
        identities = {identity_name(tags.get(k)) for k in ('name', 'name:en', 'name:zh', 'name:zh-Hans') if tags.get(k)}
        identities = {n for n in identities if len(n) >= 3}
        if any(isinstance(a.get('lat'), (int, float)) and isinstance(a.get('lng'), (int, float))
               and distance(pos, a) < .75 and identities.intersection({identity_name(a.get('name')), identity_name(a.get('nameEn'))}) for a in old):
            continue
        # Spatial matching only accompanies a similar name; nearby distinct places survive.
        if any(isinstance(a.get('lat'), (int, float)) and isinstance(a.get('lng'), (int, float))
               and distance(pos, a) < .18
               and any(n and m and (n in m or m in n) and min(len(n), len(m)) >= 4
                       for n in names for m in (normalize(a.get('name')), normalize(a.get('nameEn')))) for a in old):
            continue
        cat, role, minutes, kind, public_scope = category(tags)
        website = official_url(tags)
        score = (40 if article else 0) + (15 if tags.get('wikidata') else 0) + (10 if website else 0)
        score += 15 if role == 'neighborhood' else 0
        score += 4 if tags.get('name:zh') or tags.get('name:en') else 0
        score -= min(15, km)
        candidates.append((score, km, element, names, article, website, cat, role, minutes, kind, public_scope, pos))
    candidates.sort(key=lambda x: (-x[0], x[1], x[2]['type'], x[2]['id']))
    selected, seen_names, seen_wikidata, buckets = [], set(), set(), {}
    for row in candidates:
        buckets.setdefault(row[6], []).append(row)
    # Round-robin categories after ranking within each: small parks and galleries
    # must not vanish behind hundreds of high-ranking streets or market records.
    order = ['街区漫游', '街巷与广场', '市场与日常', '公园与花园', '博物馆与艺术', '历史与文化', '商业街区', '城市与自然视野', '当地探索']
    while any(buckets.values()):
        for cat in order:
            if buckets.get(cat):
                selected.append(buckets[cat].pop(0))
    output = []
    for row in selected:
        _, km, element, names, article, website, cat, role, minutes, kind, public_scope, pos = row
        tags = element['tags']
        wikidata = tags.get('wikidata')
        if names & seen_names or (wikidata and wikidata in seen_wikidata):
            continue
        seen_names.update(names)
        if wikidata:
            seen_wikidata.add(wikidata)
        source = f"https://www.openstreetmap.org/{element['type']}/{element['id']}"
        name = tags.get('name:zh-Hans') or tags.get('name:zh') or tags['name']
        name_en = tags.get('name:en') or tags.get('int_name') or tags['name']
        fee = tags.get('fee', '').strip().lower()
        public_outdoor = public_scope and not tags.get('building')
        public_outdoor = public_outdoor and tags.get('indoor', '').lower() in ('', 'no', 'false', '0')
        public_outdoor = public_outdoor and tags.get('tunnel', '').lower() in ('', 'no', 'false', '0')
        if fee == 'no':
            price_type, note = 'free', 'OSM fee=no 标记，尚未向经营者核实；餐饮、购物、停车、导览和额外服务另计，现场规则优先。'
        elif public_outdoor and fee == '':
            price_type, note = 'estimate', '仅按街区或街巷的户外公共范围零门票规划，不代表内部场馆免费；消费、导览与特别活动另计。'
        else:
            price_type, note = 'missing', '入场费用待补充；零占位不代表免费。须核对是否收费、票种、开放与预约条件后再确认预算。'
        date = raw['fetchedAt'][:10]
        public_walk = (tags.get('place') in ('quarter', 'neighbourhood') or tags.get('highway') == 'pedestrian')
        public_walk = public_walk and public_outdoor and fee in ('', 'no')
        sight = {
            'id': f"osm-{city['id']}-{element['type']}-{element['id']}",
            'name': name, 'nameEn': name_en, **pos,
            'coordinateAccuracy': 'osm-node' if element['type'] == 'node' else 'osm-area-center',
            'coordinateNote': '来源为 OSM 点位或区域中心，范围可能跨越多条街道；入口及步行可达性须打开地图核对。',
            'durationHours': minutes / 60,
            'durationRange': {'min': 30 if minutes <= 60 else 45, 'recommended': minutes, 'max': 120 if minutes <= 60 else 180},
            'durationBasis': 'editorial-estimate', 'category': cat,
            'activityType': 'leisure' if cat in ('公园与花园', '城市与自然视野') else 'culture',
            'visitRole': role, 'automaticPlanning': public_walk, 'priority': 48 if role == 'neighborhood' else 38,
            'description': f'{name} 是源地图中具名的{kind}，位于{city["name"]}参考中心周边。可按兴趣加入行程；建议用时为编辑估计，特色内容、入口、营业与可参观范围尚未逐项人工核实。',
            'features': [cat, '可自行加入行程'], 'bestTime': '请核对当天开放与天气；未设定固定游览时段',
            'sourceProvider': 'openstreetmap', 'sourceUrl': source, 'sourceCheckedAt': date,
            'sourceFetchedAt': raw['fetchedAt'], 'sourceDataTimestamp': raw.get('osm3s', {}).get('timestamp_osm_base'),
            'attribution': '© OpenStreetMap contributors', 'license': 'ODbL-1.0', 'licenseUrl': LICENSE,
            'osm': {'type': element['type'], 'id': element['id'], 'tags': {k: tags[k] for k in ('name', 'name:en', 'name:zh', 'name:zh-Hans', 'tourism', 'leisure', 'place', 'historic', 'amenity', 'shop', 'highway', 'fee', 'access', 'opening_hours', 'wikipedia', 'wikidata') if k in tags}},
            'distanceFromCityCenterKm': round(km, 2),
            'price': {'low': 0, 'high': 0, 'currency': city['currency'], 'type': price_type, 'checkedAt': None,
                      'sourceUrl': source, 'sourceName': 'OpenStreetMap 地点标记，非经营者报价', 'note': note},
        }
        if website:
            sight['officialWebsite'] = website
            sight['websiteVerification'] = 'osm-tag-not-independently-verified'
        if article:
            sight['article'] = article
            sight['image'] = {'sourceUrl': 'https://en.wikipedia.org/wiki/' + urllib.parse.quote(article.replace(' ', '_'))}
        else:
            sight['noArticle'] = True
        if wikidata:
            sight['wikidata'] = wikidata
        output.append(sight)
        if len(output) >= cap:
            break
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cities', help='Comma-separated city IDs; default all maintained tourism cities')
    parser.add_argument('--endpoint', default='https://overpass-api.de/api/interpreter')
    parser.add_argument('--proxy', help='Explicit network proxy; never included in saved provenance')
    parser.add_argument('--radius', type=int, default=6000)
    parser.add_argument('--per-city', type=int, default=30)
    parser.add_argument('--batch-size', type=int, default=2, help='Combine up to 2 city boxes in one serial request')
    parser.add_argument('--delay', type=float, default=3)
    parser.add_argument('--cache-days', type=int, default=30)
    parser.add_argument('--cache-only', action='store_true', help='Rebuild derived JSON from existing responses without network')
    parser.add_argument('--max-requests', type=int, default=80, help='Per-run request guard; one-off bootstrap may raise explicitly')
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    if args.cache_only:
        args.max_requests = 0
    if not (1000 <= args.radius <= 15000 and 5 <= args.per_city <= 60 and args.delay >= 1 and args.batch_size in (1, 2)):
        parser.error('radius 1000..15000, per-city 5..60, batch-size 1..2 and delay >=1 required')
    CACHE.mkdir(parents=True, exist_ok=True)
    if args.proxy:
        urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({'http': args.proxy, 'https': args.proxy})))
    requested = set(args.cities.split(',')) if args.cities else None
    targets = [c for c in cities() if requested is None or c['id'] in requested]
    existing = {r['cityId']: r for r in read(OUTPUT, [])}
    report = {'startedAt': now(), 'endpoint': args.endpoint, 'radiusMeters': args.radius, 'perCityLimit': args.per_city,
              'requestedCities': len(targets), 'completed': [], 'failures': [], 'deferred': []}
    requests = 0
    prefetched = set()
    def cache_path(city):
        key = hashlib.sha256((str(QUERY_VERSION) + query(city, args.radius)).encode()).hexdigest()[:12]
        return CACHE / f"{city['id']}-{key}.json"
    def fresh(city):
        path = cache_path(city)
        return path.exists() and (city['id'] in prefetched or (not args.refresh and (time.time() - path.stat().st_mtime) / 86400 < args.cache_days))
    for index, city in enumerate(targets):
        q = query(city, args.radius)
        cache_file = cache_path(city)
        raw = read(cache_file)
        age = (time.time() - cache_file.stat().st_mtime) / 86400 if cache_file.exists() else math.inf
        cached = bool(raw and (args.cache_only or city['id'] in prefetched or (age < args.cache_days and not args.refresh)))
        if not cached:
            if requests >= args.max_requests:
                report['deferred'].append(city['id'])
                continue
            raw = None
            batch = [city]
            for peer in targets[index + 1:]:
                if len(batch) >= args.batch_size:
                    break
                if not fresh(peer):
                    batch.append(peer)
            if len(batch) > 1:
                bodies = [query(peer, args.radius).split(';(', 1)[1].rsplit(');out center tags;', 1)[0] for peer in batch]
                q = '[out:json][timeout:30][maxsize:67108864];(' + ''.join(bodies) + ');out center tags;'
            for attempt in range(2):
                if requests >= args.max_requests:
                    break
                requests += 1
                if requests > 1:
                    time.sleep(args.delay)
                request = urllib.request.Request(args.endpoint, data=urllib.parse.urlencode({'data': q}).encode(),
                    headers={'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'})
                try:
                    with urllib.request.urlopen(request, timeout=45) as response:
                        payload = response.read(24 * 1024 * 1024)
                    result = json.loads(payload)
                    if result.get('remark') or not isinstance(result.get('elements'), list):
                        raise ValueError(str(result.get('remark') or 'Missing elements'))
                    fetched_at = now()
                    for peer in batch:
                        elements = []
                        for element in result['elements']:
                            point = element.get('center', element)
                            if 'lat' in point and 'lon' in point and distance(peer, {'lat': point['lat'], 'lng': point['lon']}) <= args.radius / 1000:
                                elements.append(element)
                        saved = {**result, 'elements': elements, 'fetchedAt': fetched_at, 'endpoint': args.endpoint,
                                 'query': q, 'requestedCityQuery': query(peer, args.radius)}
                        write(cache_path(peer), saved)
                        prefetched.add(peer['id'])
                        if peer['id'] == city['id']:
                            raw = saved
                    break
                except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
                    print(json.dumps({'city': city['id'], 'attempt': attempt + 1, 'error': str(error)}, ensure_ascii=False), flush=True)
                    if isinstance(error, urllib.error.HTTPError) and error.code in (403, 406):
                        # Do not rotate identities/endpoints to bypass a refusal.
                        time.sleep(30)
                        break
                    if isinstance(error, urllib.error.HTTPError) and error.code == 429:
                        retry_after = error.headers.get('Retry-After', '')
                        pause = max(30, int(retry_after)) if retry_after.isdigit() else 30
                        time.sleep(min(pause, 300))
                        continue
                    if attempt == 0:
                        if len(batch) > 1:
                            batch = [city]
                            q = query(city, args.radius)
                        time.sleep(30)
            if raw is None:
                report['failures'].append(city['id'])
                write(CACHE / 'last-run.json', {**report, 'requests': requests, 'updatedAt': now()})
                continue
        attractions = transform(city, raw, args.radius, args.per_city)
        existing[city['id']] = {'cityId': city['id'], 'attractions': attractions,
            'sourceProvider': 'openstreetmap', 'attribution': '© OpenStreetMap contributors',
            'license': 'ODbL-1.0', 'licenseUrl': LICENSE, 'sourceFetchedAt': raw['fetchedAt'],
            'coverage': {'radiusMeters': args.radius, 'candidateCount': len(raw['elements']), 'selectedCount': len(attractions),
                         'complete': False, 'note': '有限范围具名地点候选，不代表城市所有地点或全部营业场所。'}}
        write(OUTPUT, sorted(existing.values(), key=lambda r: r['cityId']))
        report['completed'].append({'cityId': city['id'], 'places': len(attractions), 'cached': cached})
        write(CACHE / 'last-run.json', {**report, 'requests': requests, 'updatedAt': now()})
        print(json.dumps(report['completed'][-1], ensure_ascii=False), flush=True)
    report.update({'finishedAt': now(), 'requests': requests, 'totalCities': len(existing),
                   'totalPlaces': sum(len(r['attractions']) for r in existing.values())})
    write(CACHE / 'last-run.json', report)
    print(json.dumps({k: v for k, v in report.items() if k not in ('completed',)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
