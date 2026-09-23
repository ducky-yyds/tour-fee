"""Maintain named stays from OSM without inventing room products or hotel quotes.

Standard-library-only, serial requests with caches and bounded query batches.
See docs/stay-library-sources.md. Public tags do not establish live operation.
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
OUTPUT = ROOT / 'data/experience-expansion/stays-global.json'
MANUAL = ROOT / 'data/stay-library-manual.json'
CACHE = ROOT / 'artifacts/stay-library-cache'
LICENSE = 'https://opendatacommons.org/licenses/odbl/1-0/'
USER_AGENT = 'TusuanStayLibrary/1.0 (+https://github.com/ducky-yyds/tour-fee; cached editorial collection)'
TYPES = {'hotel': '酒店', 'guest_house': '民宿或小型旅馆', 'hostel': '青年旅舍'}
GENERIC = {'hotel', 'hostel', 'guesthouse', '酒店', '宾馆', '旅馆', '民宿', '青年旅舍', '住宿'}


def read(path, default=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else default


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')


RULES = read(ROOT / 'data/stay-library-exclusions.json', {})
EXCLUDED_OBJECTS = {e['osmKey'] for e in RULES.get('excludedObjects', [])}
EXCLUDED_PHOTO_ARTICLES = {e['article'] for e in RULES.get('excludedImageArticles', [])}
DISABLED_WEBSITE_HOSTS = {e['host'] for e in RULES.get('disabledWebsiteHosts', [])}


def norm(value):
    return ''.join(x for x in unicodedata.normalize('NFKD', value or '').casefold() if x.isalnum())


def distance(a, b):
    x, y = math.radians(a['lat']), math.radians(b['lat'])
    h = math.sin((y-x)/2)**2 + math.cos(x)*math.cos(y)*math.sin(math.radians(b['lng']-a['lng'])/2)**2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def city_catalog():
    merged = {c['id']: c for c in read(ROOT / 'data/cities.json', [])}
    for file in sorted((ROOT / 'data/expansion').glob('*.json')):
        for city in read(file, []):
            merged[city['id']] = {**merged.get(city['id'], {}), **city}
    return [c for c in merged.values() if c.get('coverage') != 'airport-only' and c.get('daily', {}).get('lodging')]


def existing_stays():
    files = [ROOT / 'data/city-experiences.json', ROOT / 'data/city-activities.json',
             *sorted((ROOT / 'data/experience-expansion').glob('*.json'))]
    rows = [e for file in files if file != OUTPUT for e in read(file, []) if e.get('kind') == 'hotel']
    return rows + read(MANUAL, [])


def query_body(city, radius):
    dlat = radius / 111320
    dlng = radius / (111320 * max(.1, math.cos(math.radians(city['lat']))))
    bbox = f"({city['lat']-dlat:.6f},{city['lng']-dlng:.6f},{city['lat']+dlat:.6f},{city['lng']+dlng:.6f})"
    return f'nwr{bbox}[tourism~"^(hotel|guest_house|hostel)$"][name];'


def query(batch, radius):
    return '[out:json][timeout:30][maxsize:67108864];(' + ''.join(query_body(c, radius) for c in batch) + ');out center tags;'


def cache_path(city, radius):
    key = hashlib.sha256(query([city], radius).encode()).hexdigest()[:12]
    return CACHE / f"{city['id']}-{key}.json"


def url(value):
    value = (value or '').split(';')[0].strip()
    try:
        parsed = urllib.parse.urlparse(value)
        host = (parsed.hostname or '').lower().removeprefix('www.')
        if host in DISABLED_WEBSITE_HOSTS:
            return None
        return value if parsed.scheme in ('http', 'https') and parsed.netloc else None
    except ValueError:
        return None


def article(tags):
    if tags.get('wikipedia') and tags.get('wikipedia') == tags.get('brand:wikipedia'):
        return ''
    if tags.get('wikidata') and tags.get('wikidata') == tags.get('brand:wikidata'):
        return ''
    raw = tags.get('wikipedia:en', '')
    if tags.get('wikipedia', '').startswith('en:'):
        raw = tags['wikipedia'][3:]
    result = raw.removeprefix('en:').split('#')[0].replace('_', ' ').strip()
    return '' if result in EXCLUDED_PHOTO_ARTICLES else result


def entity_wikidata(tags):
    value = tags.get('wikidata')
    return value if value and value != tags.get('brand:wikidata') else None


def eligible(e):
    tags = e.get('tags', {})
    if f"{e['type']}/{e['id']}" in EXCLUDED_OBJECTS or tags.get('amenity') in ('bar', 'pub', 'nightclub', 'cafe'):
        return False
    if tags.get('tourism') not in TYPES or len(tags.get('name', '').strip()) < 2:
        return False
    if norm(tags['name']) in GENERIC:
        return False
    if tags.get('access', '').lower() in ('no', 'private', 'military', 'permit', 'members'):
        return False
    if tags.get('opening_hours', '').strip().lower() in ('closed', 'off', '24/7 off'):
        return False
    if any(tags.get(k, '').lower() in ('yes', 'true', '1') for k in ('disused', 'abandoned', 'demolished', 'construction', 'ruins')):
        return False
    if any(k.startswith(('disused:', 'abandoned:', 'demolished:', 'proposed:', 'construction:')) for k in tags):
        return False
    return True


def names_from_tags(tags):
    return {norm(value) for key in ('name', 'name:en', 'name:zh', 'name:zh-Hans', 'alt_name', 'alt_name:en')
            for value in tags.get(key, '').split(';') if value}


def name_identity(value):
    text = unicodedata.normalize('NFKD', (value or '').replace("'", '').replace('’', '')).casefold()
    words = re.findall(r'[^\W_]+', text, flags=re.UNICODE)
    return tuple(sorted(w for w in words if w not in ('hotel', 'hotels', 'resort', 'spa', 'the', 'a', 'an', 'and', 'by', 'collection')))


def duplicate(names, pos, wikidata, old, article_name='', identities=None):
    for e in old:
        old_names = {norm(e.get(k)) for k in ('name', 'nameEn', 'imageArticle', 'article') if e.get(k)}
        old_names.update(e.get('_sourceNames', []))
        if names & old_names or (article_name and norm(article_name) in old_names):
            return True
        if wikidata and e.get('wikidata') == wikidata:
            return True
        if isinstance(e.get('lat'), (int, float)) and isinstance(e.get('lng'), (int, float)) and distance(e, pos) < .25:
            if identities and any(len(identity) >= 2 and identity in identities for identity in (name_identity(e.get('name')), name_identity(e.get('nameEn')))):
                return True
            if any(min(len(a), len(b)) >= 5 and (a in b or b in a) for a in names for b in old_names):
                return True
    return False


def price_options(city):
    options = []
    for index, (key, label) in enumerate((('budget', '经济'), ('comfort', '舒适'), ('premium', '高端'))):
        amount = float(city['daily']['lodging'][index])
        options.append({
            'id': key + '-allowance', 'name': label + '预算预留 · 城市参考',
            'description': f'按{city["name"]}城市{label}住宿档预留一间一晚预算；不是这家住宿的实际售价、房型或可售产品。',
            'low': amount, 'high': amount, 'currency': city['currency'], 'unit': 'room-night',
            'type': 'estimate', 'checkedAt': None, 'priceBasis': 'city-daily-lodging',
            'sourceName': city['name'] + '城市住宿编辑预算；非该住宿报价',
            'note': '此金额只用于未取得报价前的成本预留，可能不适用于这家住宿。真实房型、床位或整间计价、容纳人数、税费和日期需向经营者询价后调整。',
            'includes': [], 'excludes': ['未确认包含的早餐、加床、税费、接送及其他服务'],
        })
    return options


def build(city, e, raw):
    tags = e['tags']
    p = e.get('center', e)
    source = f"https://www.openstreetmap.org/{e['type']}/{e['id']}"
    ident = f"stay-{city['id']}-osm-{e['type']}-{e['id']}"
    website = url(tags.get('website') or tags.get('contact:website'))
    name = tags.get('name:zh-Hans') or tags.get('name:zh') or tags['name']
    address_tags = {k: v for k, v in tags.items() if k.startswith('addr:')}
    street = ' '.join(tags[k] for k in ('addr:housenumber', 'addr:street') if tags.get(k))
    address_parts = [street] + [tags[k] for k in ('addr:place', 'addr:suburb', 'addr:city', 'addr:postcode', 'addr:country') if tags.get(k)]
    address = tags.get('addr:full') or ', '.join(dict.fromkeys(x for x in address_parts if x))
    center_km = round(distance(city, {'lat': p['lat'], 'lng': p['lon']}), 2)
    location = tags.get('addr:suburb') or tags.get('addr:place') or tags.get('addr:street')
    location_text = f'，地址位于 {location}' if location else ''
    description = f'位于{city["name"]}，距城市参考中心约{center_km:.1f}公里的{TYPES[tags["tourism"]]}{location_text}。可查看位置与预订渠道，比较前往计划街区的便利程度。'
    item = {
        'id': ident, 'cityId': city['id'], 'kind': 'hotel', 'name': name,
        'nameEn': tags.get('name:en') or tags.get('int_name') or tags['name'],
        'accommodationType': tags['tourism'], 'provider': tags.get('operator') or tags.get('brand') or 'OpenStreetMap 住宿资料',
        'tagline': f'{TYPES[tags["tourism"]]} · 距参考中心约{center_km:.1f}公里', 'description': description,
        'verificationNote': '名称、住宿类型、位置及已有地址来自 OpenStreetMap 公开地图资料。当前营业、预订渠道、设施和房型尚未向经营者逐项确认。',
        'lat': p['lat'], 'lng': p['lon'], 'coordinateAccuracy': 'osm-node' if e['type'] == 'node' else 'osm-area-center',
        'coordinateNote': '公开地图点位或区域中心，入口、同名分店及接送集合点须以经营者确认信息为准。',
        'durationMinutes': 0, 'features': [TYPES[tags['tourism']], '具名住宿', '房价待询'],
        'sourceProvider': 'openstreetmap', 'sourceUrl': source, 'sourceCheckedAt': raw['fetchedAt'][:10],
        'sourceFetchedAt': raw['fetchedAt'], 'sourceDataTimestamp': raw.get('osm3s', {}).get('timestamp_osm_base'),
        'checkedAt': raw['fetchedAt'][:10], 'operatingStatus': 'not-independently-verified',
        'hotelQuoteStatus': 'not-verified', 'priceBasis': 'city-daily-lodging',
        'attribution': '© OpenStreetMap contributors', 'license': 'ODbL-1.0', 'licenseUrl': LICENSE,
        'addressTags': address_tags, 'addressVerification': 'osm-tag-not-independently-verified',
        'availabilityNote': '经营状态与所选日期房态尚未确认。显示金额来自城市住宿预算，不能作为该住宿报价；未承诺早餐、房型、床位、星级评定或任何包含服务。',
        'requirements': ['预订前确认当前营业、实际地址和入住日期', '核对按床位还是按整间计价，以及允许入住人数', '取得实际报价后更新预算，并核对税费、取消和含餐条款'],
        'priceOptions': price_options(city), 'imageRef': ident,
        'distanceFromCityCenterKm': center_km,
        'osm': {'type': e['type'], 'id': e['id'], 'tags': tags},
    }
    if address:
        item['address'] = address
    else:
        item['addressNote'] = '源资料未提供完整门牌地址；请打开地图核对实际入口。'
    if website:
        item.update({'officialWebsite': website, 'bookingUrl': website, 'websiteVerification': 'osm-tag-not-independently-verified'})
    if tags.get('stars'):
        item['starsSourceTag'] = tags['stars']
        item['starsVerification'] = 'osm-tag-not-independently-verified'
    wiki = article(tags)
    if wiki:
        item['imageArticle'] = wiki
        item['article'] = wiki
        item['image'] = {'sourceUrl': 'https://en.wikipedia.org/wiki/' + urllib.parse.quote(wiki.replace(' ', '_'))}
    else:
        item['noArticle'] = True
    if entity_wikidata(tags):
        item['wikidata'] = entity_wikidata(tags)
    if tags.get('wikimedia_commons', '').startswith('File:'):
        item['imageSource'] = 'https://commons.wikimedia.org/wiki/' + urllib.parse.quote(tags['wikimedia_commons'].replace(' ', '_'))
    if url(tags.get('image')):
        item['imageSourceHint'] = tags['image']
        item['imageLicenseStatus'] = 'unverified-do-not-publish-without-license'
    return item


def select(city, raw, old, minimum, radius):
    radius = min(radius, RULES.get('selectionRadiusMeters', {}).get(city['id'], radius))
    candidates = []
    for e in raw.get('elements', []):
        if not eligible(e):
            continue
        p = e.get('center', e)
        if 'lat' not in p or 'lon' not in p:
            continue
        pos = {'lat': p['lat'], 'lng': p['lon']}
        km = distance(city, pos)
        if km > radius / 1000:
            continue
        tags = e['tags']
        names = names_from_tags(tags)
        identities = {name_identity(tags.get(k)) for k in ('name', 'name:en', 'name:zh', 'name:zh-Hans') if tags.get(k)}
        wiki = article(tags)
        if duplicate(names, pos, entity_wikidata(tags), old, wiki, identities):
            continue
        score = (60 if wiki else 0) + (50 if url(tags.get('website') or tags.get('contact:website')) else 0)
        score += (20 if any(k.startswith('addr:') for k in tags) else 0) + (15 if entity_wikidata(tags) else 0)
        score += 10 if tags.get('tourism') == 'hotel' else 0
        score -= min(20, km * 2)
        candidates.append((score, km, e, names, pos, wiki, identities))
    selected = []
    for _, _, e, names, pos, wiki, identities in sorted(candidates, key=lambda r: (-r[0], r[1], r[2]['type'], r[2]['id'])):
        if duplicate(names, pos, entity_wikidata(e['tags']), old + selected, wiki, identities):
            continue
        item = build(city, e, raw)
        item['_sourceNames'] = list(names)
        selected.append(item)
        if len(old) + len(selected) >= minimum:
            break
    for item in selected:
        item.pop('_sourceNames', None)
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cities')
    parser.add_argument('--endpoint', default='https://overpass-api.de/api/interpreter')
    parser.add_argument('--proxy')
    parser.add_argument('--radius', type=int, default=10000)
    parser.add_argument('--minimum', type=int, default=5)
    parser.add_argument('--batch-size', type=int, default=3)
    parser.add_argument('--delay', type=float, default=4)
    parser.add_argument('--max-requests', type=int, default=80)
    parser.add_argument('--cache-days', type=int, default=30)
    parser.add_argument('--cache-only', action='store_true')
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    if not (6000 <= args.radius <= 15000 and 1 <= args.minimum <= 10 and 1 <= args.batch_size <= 3 and args.delay >= 3):
        parser.error('radius 6000..15000, minimum 1..10, batch-size 1..3, delay >=3 required')
    if args.cache_only:
        args.max_requests = 0
    if args.proxy:
        urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({'http': args.proxy, 'https': args.proxy})))
    requested = set(args.cities.split(',')) if args.cities else None
    targets = [c for c in city_catalog() if requested is None or c['id'] in requested]
    old_rows = existing_stays()
    manual_ids = {e['id'] for e in read(MANUAL, [])}
    existing = {e['id']: e for e in read(OUTPUT, []) if e['id'] not in manual_ids}
    existing.update({e['id']: e for e in read(MANUAL, [])})
    for entry in existing.values():
        removed = False
        for field in ('officialWebsite', 'bookingUrl'):
            if entry.get(field) and not url(entry[field]):
                del entry[field]
                removed = True
        if removed:
            entry['websiteVerification'] = 'disabled-after-source-review'
            entry['websiteNote'] = '旧网站链接已失效，预订前请通过其他渠道核对当前经营者。'
    # Apply explicit exclusions even when this city already meets the minimum.
    existing = {key: entry for key, entry in existing.items()
                if key in manual_ids or not entry.get('osm') or eligible(entry['osm'])}
    prefetched, requests = set(), 0
    report = {'startedAt': now(), 'endpoint': args.endpoint, 'radiusMeters': args.radius, 'requestedCities': len(targets),
              'minimumPerCity': args.minimum, 'completed': [], 'failures': [], 'deferred': []}
    def fresh(city):
        p = cache_path(city, args.radius)
        return p.exists() and (city['id'] in prefetched or (not args.refresh and (time.time()-p.stat().st_mtime)/86400 < args.cache_days))
    for i, city in enumerate(targets):
        old = [e for e in old_rows if e['cityId'] == city['id']]
        retained = [e for key, e in existing.items() if e['cityId'] == city['id'] and key not in manual_ids]
        if len(old) >= args.minimum:
            write(OUTPUT, sorted(existing.values(), key=lambda e: (e['cityId'], e['id'])))
            report['completed'].append({'cityId': city['id'], 'existing': len(old), 'retained': len(retained), 'added': 0, 'total': len(old)+len(retained), 'cached': True})
            continue
        path = cache_path(city, args.radius)
        raw = read(path)
        cached = bool(raw and (args.cache_only or fresh(city)))
        if not cached:
            if requests >= args.max_requests:
                report['deferred'].append(city['id'])
                continue
            raw = None
            batch = [city]
            for peer in targets[i+1:]:
                if len(batch) >= args.batch_size:
                    break
                if not fresh(peer) and sum(e['cityId'] == peer['id'] for e in old_rows) < args.minimum:
                    batch.append(peer)
            for attempt in range(2):
                if requests >= args.max_requests:
                    break
                if requests:
                    time.sleep(args.delay)
                requests += 1
                q = query(batch, args.radius)
                request = urllib.request.Request(args.endpoint, data=urllib.parse.urlencode({'data': q}).encode(),
                    headers={'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'})
                try:
                    with urllib.request.urlopen(request, timeout=45) as response:
                        data = json.loads(response.read(24*1024*1024))
                    if data.get('remark') or not isinstance(data.get('elements'), list):
                        raise ValueError(str(data.get('remark') or 'Missing elements'))
                    fetched_at = now()
                    for peer in batch:
                        elements = []
                        for e in data['elements']:
                            p = e.get('center', e)
                            if 'lat' in p and 'lon' in p and distance(peer, {'lat': p['lat'], 'lng': p['lon']}) <= args.radius/1000:
                                elements.append(e)
                        saved = {**data, 'elements': elements, 'fetchedAt': fetched_at, 'endpoint': args.endpoint, 'query': q}
                        write(cache_path(peer, args.radius), saved)
                        prefetched.add(peer['id'])
                        if peer['id'] == city['id']:
                            raw = saved
                    break
                except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
                    print(json.dumps({'city': city['id'], 'attempt': attempt+1, 'error': str(error)}, ensure_ascii=False), flush=True)
                    if isinstance(error, urllib.error.HTTPError) and error.code in (403, 406):
                        time.sleep(30)
                        break
                    if isinstance(error, urllib.error.HTTPError) and error.code == 429:
                        retry = error.headers.get('Retry-After', '')
                        time.sleep(min(300, max(30, int(retry) if retry.isdigit() else 30)))
                        continue
                    if attempt == 0:
                        batch = [city]
                        time.sleep(30)
            if raw is None:
                report['failures'].append(city['id'])
                write(CACHE / 'last-run.json', {**report, 'requests': requests, 'updatedAt': now()})
                continue
        # Five is a minimum, not a cap. Refresh known mapped stays in place so
        # adding editorial hotels does not remove other existing choices.
        objects = {f"{item['type']}/{item['id']}": item for item in raw.get('elements', [])}
        refreshed = []
        radius = min(args.radius, RULES.get('selectionRadiusMeters', {}).get(city['id'], args.radius))
        for previous in retained:
            osm = previous.get('osm', {})
            current = objects.get(f"{osm.get('type')}/{osm.get('id')}")
            if current is None:
                refreshed.append(previous)  # A missing bounded-query result is not proof of closure.
                continue
            pos = current.get('center', current)
            if eligible(current) and 'lat' in pos and 'lon' in pos and distance(city, {'lat': pos['lat'], 'lng': pos['lon']}) <= radius / 1000:
                refreshed.append(build(city, current, raw))
        known = old + refreshed
        selected = select(city, raw, known, args.minimum, args.radius) if len(known) < args.minimum else []
        existing = {k: e for k, e in existing.items() if e['cityId'] != city['id'] or k in manual_ids}
        existing.update({e['id']: e for e in refreshed})
        existing.update({e['id']: e for e in selected})
        write(OUTPUT, sorted(existing.values(), key=lambda e: (e['cityId'], e['id'])))
        result = {'cityId': city['id'], 'existing': len(old), 'retained': len(refreshed), 'added': len(selected), 'total': len(known)+len(selected), 'cached': cached}
        report['completed'].append(result)
        write(CACHE / 'last-run.json', {**report, 'requests': requests, 'updatedAt': now()})
        print(json.dumps(result, ensure_ascii=False), flush=True)
    report.update({'finishedAt': now(), 'requests': requests, 'newStays': len(existing),
                   'underMinimum': [r for r in report['completed'] if r['total'] < args.minimum]})
    write(CACHE / 'last-run.json', report)
    print(json.dumps({k: v for k, v in report.items() if k != 'completed'}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
