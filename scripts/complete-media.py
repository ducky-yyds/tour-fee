"""Fill card images from licensed exact subjects, local context, then labelled art.

One API request at a time with a persistent cache. CDN downloads use three
workers and a shared rate limiter; refusals are never bypassed. See docs/images.md.
"""
import argparse
import concurrent.futures
import datetime as dt
import hashlib
import html
import json
import math
import pathlib
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'artifacts/media-completion-cache'
OUTPUT = ROOT / 'data/media.json'
AGENT = 'TusuanTravelMedia/2.0 (+https://github.com/ducky-yyds/tour-fee; licensed cached media)'
API = 'https://commons.wikimedia.org/w/api.php'
LOCK = threading.Lock()
NEXT_REQUEST = {'api': 0, 'cdn': 0}
MAX_BYTES = 750 * 1024
THUMB_WIDTH = 500
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def read(path, fallback=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else fallback


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def plain(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', value or ''))).strip()


def file_title(value):
    return (value or '').removeprefix('File:').replace('_', ' ')


NEARBY_EXCLUSIONS = read(ROOT / 'data/nearby-photo-exclusions.json', {})


def stamp():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')


def distance(a, b):
    lat1, lat2 = math.radians(a['lat']), math.radians(b['lat'])
    x = math.sin((lat1-lat2)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(math.radians(a['lng']-b['lng'])/2)**2
    return 6371000 * 2 * math.asin(min(1, math.sqrt(x)))


def request(url, binary=False):
    mode = 'cdn' if binary else 'api'
    for attempt in range(3):
        with LOCK:
            delay = max(0, NEXT_REQUEST[mode] - time.monotonic())
            NEXT_REQUEST[mode] = time.monotonic() + delay + (0.4 if binary else 1.25)
        if delay:
            time.sleep(delay)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': AGENT, 'Accept': 'image/*' if binary else 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as response:
                limit = MAX_BYTES if binary else 32 * 1024 * 1024
                body = response.read(limit + 1)
                if len(body) > limit:
                    raise ValueError('Response exceeds size allowance')
                if binary:
                    if not (body[:3] == b'\xff\xd8\xff' or body[:8] == b'\x89PNG\r\n\x1a\n' or body[:4] == b'RIFF' and body[8:12] == b'WEBP'):
                        raise ValueError('Not a JPEG, PNG or WebP photograph')
                    return body
                data = json.loads(body)
                if 'error' in data:
                    raise ValueError(str(data['error']))
                return data
        except urllib.error.HTTPError as error:
            if error.code in (401, 403, 404, 406):
                raise
            if error.code == 429:
                retry = error.headers.get('Retry-After', '')
                pause = max(30, int(retry)) if retry.isdigit() else 30
                with LOCK:
                    NEXT_REQUEST[mode] = max(NEXT_REQUEST[mode], time.monotonic() + pause)
            else:
                pause = 5 * (attempt + 1)
            if attempt == 2:
                raise
            time.sleep(pause)
        except (urllib.error.URLError, TimeoutError, OSError):
            if attempt == 2:
                raise
            time.sleep(5 * (attempt + 1))


def api(params, endpoint=API):
    params = {'action': 'query', 'format': 'json', **params}
    url = endpoint + '?' + urllib.parse.urlencode(params)
    cache = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.json')
    saved = read(cache)
    if saved and time.time() - cache.stat().st_mtime < 30 * 86400:
        return saved
    result = request(url)
    write(cache, result)
    return result


def usable(info, file):
    if not re.search(r'\.(jpe?g|png|webp)$', file, re.I):
        return False
    meta = info.get('extmetadata', {})
    license_name = plain(meta.get('LicenseShortName', {}).get('value'))
    if not re.fullmatch(r'CC BY(?:-SA)? (?:1\.0|2\.[015]|3\.0|4\.0)(?: [a-z]{2}(?:-[a-z]+)?)?|CC0|Public domain|FAL|Free Art License', license_name, re.I):
        return False
    description = plain(meta.get('ImageDescription', {}).get('value'))
    if re.search(r'(?:^|[\s_.-])(?:flag|map|logo|locator|emblem|coat.of.arms|portrait|icon)(?:[\s_.-]|$)', file, re.I):
        return False
    if re.search(r'framing symbol|locator map|\bmap of\b|coat of arms|floor plan|portrait de|headshot|team photograph|team portrait', description, re.I):
        return False
    return min(info.get('width', 0), info.get('height', 0)) >= 240 and bool(info.get('thumburl') or info.get('url'))


def scenery(file, description, captured_at=''):
    if file_title(file) in NEARBY_EXCLUSIONS:
        return False
    text = file + ' ' + description
    if re.search(r'portrait|headshot|\b(?:bird|butterfly|insect|flower|painting|manuscript|coin|stamp|costume|bust|sports team|mascot|stele|pottery|ceramic|porcelain|scroll|vase|jade|figurine|sarcophagus|mummy|fossil|construction|bronze|gallery|statue|buddha|sculpture|specimen|dish|noodle|salad|dessert|dinner|lunch|cocktail|cake|sandwich|cuisine|food)\b', text, re.I):
        return False
    if re.search(r'collection of|museum collection|exhibited in|exhibit in|displayed in|artifact|artefact|瓷器|陶器|佛像|墓志|造像|青铜器|书画|出土|博物馆藏|石碑', text, re.I):
        return False
    year = re.search(r'\b(18\d{2}|19\d{2}|20\d{2})\b', captured_at)
    return not year or int(year.group()) >= 2000


def inventory():
    cities = read(ROOT / 'data/cities.json', [])
    image_sources = read(ROOT / 'data/experience-image-sources.json', {})
    # Subject-checked hotel photographs survive imports and daily maintenance.
    for path in sorted((ROOT / 'data/hotel-photo-expansion').glob('*.json')):
        for item_id, photo in read(path, {}).items():
            if not photo.get('photoFile') or not photo.get('sourceUrl', '').startswith('https://') or not photo.get('license'):
                raise ValueError('Incomplete hotel photo source: ' + item_id)
            image_sources[item_id] = {**image_sources.get(item_id, {}), 'photoFile': photo['photoFile'], 'imageScope': 'exact-place', **({'imageContextNote': photo['imageContextNote']} if photo.get('imageContextNote') else {})}
    items = []
    for city in cities:
        for place in city['attractions']:
            items.append({**place, '_city': city, '_kind': 'place'})
    for food in read(ROOT / 'data/local-foods.json', []):
        items.append({**food, '_city': next((c for c in cities if c['id'] in food.get('cityIds', [])), cities[0]), '_kind': 'food'})
    for path in [ROOT/'data/city-experiences.json', ROOT/'data/city-activities.json', *sorted((ROOT/'data/experience-expansion').glob('*.json'))]:
        for entry in read(path, []):
            items.append({**entry, **image_sources.get(entry['id'], {}), '_city': next(c for c in cities if c['id'] == entry['cityId']), '_kind': entry['kind']})
    return cities, items


def valid_photo(record):
    return record and record.get('url') and (ROOT / 'public' / record['url'].lstrip('/')).is_file()


def save_download(file, info):
    name = hashlib.sha256(file.replace('_', ' ').encode()).hexdigest()[:20]
    extension = pathlib.Path(urllib.parse.urlparse(info.get('thumburl') or info['url']).path).suffix.lower()
    if extension not in ('.jpg', '.jpeg', '.png', '.webp'):
        extension = '.jpg'
    path = ROOT / 'public/images' / f'commons-{name}{extension}'
    if not path.exists():
        body = request(info.get('thumburl') or info['url'], True)
        temp = path.with_suffix(path.suffix + '.tmp')
        temp.write_bytes(body)
        temp.replace(path)
    meta = info['extmetadata']
    return {'url': '/images/' + path.name, 'alt': plain(meta.get('ImageDescription', {}).get('value'))[:180],
            'credit': plain(meta.get('Attribution', {}).get('value') or meta.get('Artist', {}).get('value')) or 'Wikimedia Commons contributor',
            'sourceUrl': info['descriptionurl'], 'license': plain(meta.get('LicenseShortName', {}).get('value')),
            'licenseUrl': meta.get('LicenseUrl', {}).get('value') or ('https://artlibre.org/licence/lal/en/' if plain(meta.get('LicenseShortName', {}).get('value')) in ('FAL', 'Free Art License') else 'https://commons.wikimedia.org/wiki/Commons:Copyright_tags'),
            'fileTitle': file, 'description': plain(meta.get('ImageDescription', {}).get('value')),
            'capturedAt': plain(meta.get('DateTimeOriginal', {}).get('value')), 'checkedAt': stamp(),
            'remoteUrl': info.get('thumburl') or info['url'], 'width': info.get('thumbwidth', info.get('width')), 'height': info.get('thumbheight', info.get('height')),
            'bytes': path.stat().st_size, 'modifications': 'Wikimedia thumbnail; interface may crop the image to fit.'}


def apply_jobs(jobs, media, scope):
    unique = {}
    for item, file, info, extra in jobs:
        unique.setdefault(file, {'info': info, 'items': []})['items'].append((item, extra))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(save_download, file, row['info']): (file, row['items']) for file, row in unique.items()}
        for future in concurrent.futures.as_completed(futures):
            file, entries = futures[future]
            try:
                photo = future.result()
                for item, extra in entries:
                    media['attractions'][item['id']] = {**photo, 'scope': scope, **extra}
                media['updatedAt'] = stamp()
                write(OUTPUT, media)
                print(json.dumps({'photo': file, 'assigned': len(entries), 'scope': scope}, ensure_ascii=False), flush=True)
            except Exception as error:
                print(json.dumps({'failedPhoto': file, 'reason': str(error)}, ensure_ascii=False), flush=True)


def exact(items, media, excluded):
    def source_context(item):
        extra = {}
        if item.get('photoFile') or item.get('imageFile'):
            extra['requestedFileTitle'] = file_title(item.get('photoFile') or item.get('imageFile'))
            if item.get('imagePolicy') == 'exact-only':
                extra['subjectMatched'] = True
        if item.get('imageContextNote'):
            extra['contextNote'] = item['imageContextNote']
        if item.get('imageScope') == 'nearby':
            extra['scope'] = 'nearby'
            extra['contextNote'] = item.get('imageContextNote') or '相关地点或活动实景，不代表某一供应商的设施或套餐。'
        return extra

    def needs_exact(item):
        current = media['attractions'].get(item['id'])
        manual = item.get('photoFile') or item.get('imageFile')
        if manual and current and file_title(manual) != file_title(current.get('requestedFileTitle') or current.get('fileTitle')):
            return True
        return not (valid_photo(current) and current.get('scope') not in ('nearby', 'illustration'))
    targets = [item for item in items if item['id'] not in excluded and needs_exact(item)
               and (item.get('imagePolicy') != 'exact-only' or item.get('photoFile') or item.get('imageFile'))]
    excluded_articles = {row['article'] for row in read(ROOT / 'data/stay-library-exclusions.json', {}).get('excludedImageArticles', [])}
    def exact_identity_allowed(item):
        if item['_kind'] != 'hotel':
            return True
        tags = item.get('osm', {}).get('tags', {})
        article = tags.get('wikipedia', '').split(':', 1)[-1]
        return article not in excluded_articles and not (
            tags.get('wikidata') and tags.get('wikidata') == tags.get('brand:wikidata') or
            tags.get('wikipedia') and tags.get('wikipedia') == tags.get('brand:wikipedia'))
    targets = [item for item in targets if exact_identity_allowed(item) or item.get('photoFile')]
    candidates = {}
    lookups = read(ROOT / 'data/image-lookup-cache.json', {}).get('articles', {})
    for item in targets:
        file = item.get('photoFile') or item.get('imageFile')
        article = item.get('article') or item.get('imageArticle')
        if not file and article and item.get('photoStatus') != 'needs-food-photo':
            file = lookups.get(article)
        if file:
            candidates[item['id']] = file_title(file)
    entity_items = {}
    for item in targets:
        key = item.get('wikidata') or item.get('osm', {}).get('tags', {}).get('wikidata')
        if key and re.fullmatch('Q[0-9]+', key) and item['id'] not in candidates:
            entity_items.setdefault(key, []).append(item)
    keys = list(entity_items)
    for start in range(0, len(keys), 40):
        try:
            data = api({'action': 'wbgetentities', 'ids': '|'.join(keys[start:start+40]), 'props': 'claims'}, 'https://www.wikidata.org/w/api.php')
            for key, entity in data.get('entities', {}).items():
                claims = entity.get('claims', {})
                if any(c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id') == 'Q5' for c in claims.get('P31', [])):
                    continue
                files = [c.get('mainsnak', {}).get('datavalue', {}).get('value') for c in claims.get('P18', [])]
                files = [value for value in files if isinstance(value, str) and value]
                if not files:
                    continue
                for item in entity_items.get(key, []):
                    coords = [c.get('mainsnak', {}).get('datavalue', {}).get('value') for c in claims.get('P625', [])]
                    coords = [value for value in coords if isinstance(value, dict) and isinstance(value.get('latitude'), (int, float)) and isinstance(value.get('longitude'), (int, float))]
                    if coords and 'lat' in item and distance(item, {'lat': coords[0]['latitude'], 'lng': coords[0]['longitude']}) > 2000:
                        continue
                    candidates[item['id']] = files[0]
            print(json.dumps({'wikidataBatch': start, 'total': len(keys), 'candidates': len(candidates)}), flush=True)
        except Exception as error:
            print(json.dumps({'wikidataBatch': start, 'error': str(error)}), flush=True)
    # Resolve new food articles and explicit source articles in small batches.
    article_items = {}
    for item in targets:
        article = item.get('article') or item.get('imageArticle')
        if article and item['id'] not in candidates and item.get('photoStatus') != 'needs-food-photo':
            article_items.setdefault(article, []).append(item)
    articles = list(article_items)
    for start in range(0, len(articles), 20):
        try:
            result = api({'prop': 'pageimages', 'piprop': 'name', 'pilicense': 'free', 'redirects': 1, 'titles': '|'.join(articles[start:start+20])}, 'https://en.wikipedia.org/w/api.php')
            aliases = {row['from']: row['to'] for row in result.get('query', {}).get('normalized', []) + result.get('query', {}).get('redirects', [])}
            pages = {p['title']: p for p in result.get('query', {}).get('pages', {}).values()}
            for title in articles[start:start+20]:
                current = title
                for _ in range(8):
                    if current not in aliases:
                        break
                    current = aliases[current]
                file = pages.get(current, {}).get('pageimage')
                if file:
                    for item in article_items[title]:
                        candidates[item['id']] = file
        except Exception as error:
            print(json.dumps({'articleBatch': start, 'error': str(error)}), flush=True)
    by_file = {}
    for item in targets:
        if item['id'] in candidates:
            by_file.setdefault(candidates[item['id']].replace('_', ' '), []).append(item)
    files = list(by_file)
    for start in range(0, len(files), 20):
        try:
            result = api({'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': THUMB_WIDTH, 'redirects': 1, 'titles': '|'.join('File:'+f for f in files[start:start+20])})
            aliases = {file_title(row['from']): file_title(row['to']) for row in result.get('query', {}).get('normalized', []) + result.get('query', {}).get('redirects', [])}
            resolved = {}
            for requested in files[start:start+20]:
                canonical = requested
                for _ in range(8):
                    if canonical not in aliases:
                        break
                    canonical = aliases[canonical]
                resolved.setdefault(canonical, []).extend(by_file[requested])
            jobs = []
            for page in result.get('query', {}).get('pages', {}).values():
                file = page['title'].removeprefix('File:').replace('_', ' ')
                info = (page.get('imageinfo') or [{}])[0]
                if usable(info, file):
                    jobs.extend((item, file, info, source_context(item)) for item in resolved.get(file, []))
            apply_jobs(jobs, media, 'exact-place')
        except Exception as error:
            print(json.dumps({'metadataBatch': start, 'error': str(error)}), flush=True)


def nearby(cities, items, media, excluded):
    def photo_pool(center, radius=10000, limit=250):
        data = api({'generator': 'geosearch', 'ggscoord': f"{center['lat']}|{center['lng']}", 'ggsradius': radius,
                    'ggslimit': limit, 'ggsnamespace': 6, 'ggsprimary': 'all', 'prop': 'coordinates', 'colimit': 'max'})
        photos = []
        for page in data.get('query', {}).get('pages', {}).values():
            file = file_title(page['title'])
            coords = page.get('coordinates', [])
            if not coords or not re.search(r'\.(jpe?g|png|webp)$', file, re.I) or not scenery(file, ''):
                continue
            photos.append((file, {'lat': coords[0]['lat'], 'lng': coords[0]['lon']}))
        return photos
    for city in cities:
        targets = [item for item in items if item['_city']['id'] == city['id'] and item['_kind'] == 'place' and item.get('imagePolicy') != 'exact-only' and item['id'] not in excluded and (not valid_photo(media['attractions'].get(item['id'])) or media['attractions'][item['id']].get('scope') == 'illustration')]
        if not targets:
            continue
        try:
            photos = photo_pool(city)
            # Dense city centres can exhaust the API's nearest-photo limit. Two
            # bounded outlying searches cover actual catalog clusters as well.
            searched = []
            for _ in range(2):
                uncovered = [item for item in targets if not any(distance(item, pos) <= 1250 for _, pos in photos)
                             and not any(distance(item, center) <= 1250 for center in searched)]
                if not uncovered:
                    break
                center = max(uncovered, key=lambda item: sum(distance(item, peer) <= 1800 for peer in uncovered))
                searched.append(center)
                photos.extend(photo_pool(center, 2000, 100))
            photos = list(dict(photos).items())
            rankings = {item['id']: sorted((distance(item, pos), file) for file, pos in photos if distance(item, pos) <= 1250)[:30] for item in targets}
            jobs, uses, fetched, assigned = [], {}, {}, set()
            # Resolve licensing and thumbnail metadata only for shortlisted
            # candidates, not hundreds of unrelated files per city.
            for _ in range(8):
                requested = set()
                for item in targets:
                    if item['id'] in assigned:
                        continue
                    eligible = [row for row in rankings[item['id']] if row[1] not in fetched or fetched[row[1]] is not None]
                    eligible.sort(key=lambda row: row[0] + uses.get(row[1], 0) * 180)
                    if not eligible:
                        continue
                    meters, file = eligible[0]
                    if file not in fetched:
                        requested.add(file)
                        continue
                    uses[file] = uses.get(file, 0) + 1
                    assigned.add(item['id'])
                    jobs.append((item, file, fetched[file], {'contextNote': f'附近实景：图片标注坐标距此地点参考点约 {round(meters)} 米，用于了解周边环境；不是该地点内部或入口的核验照片。', 'contextDistanceMeters': round(meters), 'alt': item['name']+'附近的实景照片'}))
                if not requested:
                    break
                requested = sorted(requested)
                for start in range(0, len(requested), 20):
                    batch = requested[start:start+20]
                    fetched.update({file: None for file in batch})
                    result = api({'prop': 'imageinfo', 'titles': '|'.join('File:'+file for file in batch),
                                  'iiprop': 'url|extmetadata|size', 'iiurlwidth': THUMB_WIDTH,
                                  'iiextmetadatalanguage': 'en', 'iiextmetadatafilter': 'Artist|Attribution|LicenseShortName|LicenseUrl|ImageDescription|DateTimeOriginal'})
                    for page in result.get('query', {}).get('pages', {}).values():
                        file = file_title(page['title'])
                        info = (page.get('imageinfo') or [{}])[0]
                        meta = info.get('extmetadata', {})
                        if usable(info, file) and scenery(file, plain(meta.get('ImageDescription', {}).get('value')), plain(meta.get('DateTimeOriginal', {}).get('value'))):
                            fetched[file] = info
            apply_jobs(jobs, media, 'nearby')
            print(json.dumps({'city': city['id'], 'nearbyAssigned': len(jobs), 'candidates': len(photos)}, ensure_ascii=False), flush=True)
        except Exception as error:
            print(json.dumps({'city': city['id'], 'nearbyError': str(error)}, ensure_ascii=False), flush=True)


def fallback(items, media):
    food_art = {}
    for path in sorted((ROOT / 'data/food-art-expansion').glob('*.json')):
        food_art.update(read(path, {}))
    for item in items:
        current = media['attractions'].get(item['id'])
        artwork = food_art.get(item['id'])
        if item['_kind'] == 'food' and artwork and valid_photo(artwork) and (not valid_photo(current) or current.get('scope') == 'illustration'):
            # A subject-specific drawing replaces only generic/absent art.
            # An exact photograph always wins, including on the next refresh.
            media['attractions'][item['id']] = {key: value for key, value in artwork.items() if key != 'prompt'}
            continue
        if valid_photo(media['attractions'].get(item['id'])):
            continue
        reference = media['attractions'].get(item.get('imageRef'))
        if item.get('imagePolicy') != 'exact-only' and item.get('imageRef') != item['id'] and valid_photo(reference) and reference.get('scope') != 'illustration' and file_title(reference.get('fileTitle')) not in NEARBY_EXCLUSIONS:
            media['attractions'][item['id']] = {**reference, 'scope': 'nearby',
                'contextNote': '与本项目相关的地点实景；不是房间、套餐或供应商设施的实拍承诺。',
                'alt': item['name'] + '相关地点的环境实景'}
            continue
        key = 'food' if item['_kind'] in ('food', 'restaurant') else 'stay' if item['_kind'] == 'hotel' else 'nature' if item.get('activityType') == 'leisure' else 'culture' if re.search('博物馆|文化|艺术|历史', item.get('category', '')) else 'walk'
        file = ROOT / f'public/images/illustration-{key}.png'
        if not file.exists():
            raise ValueError('Missing illustration asset: ' + str(file))
        media['attractions'][item['id']] = {'url': f'/images/illustration-{key}.png', 'alt': item['name']+' · 主题插画', 'scope': 'illustration',
            'contextNote': 'AI 绘制的主题插画，用于表达活动或住宿氛围；不是该地点、房间或食物的实拍与外观承诺。',
            'credit': '途算 · AI 主题插画', 'sourceUrl': 'https://github.com/ducky-yyds/tour-fee/blob/main/docs/generated-media.md',
            'license': 'AI-generated project artwork', 'licenseUrl': 'https://github.com/ducky-yyds/tour-fee/blob/main/docs/generated-media.md',
            'checkedAt': stamp(), 'bytes': file.stat().st_size}
    media['updatedAt'] = stamp()
    write(OUTPUT, media)


def main():
    global THUMB_WIDTH
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phase', choices=['exact', 'nearby', 'fallback', 'all'], default='all')
    parser.add_argument('--cities', default='')
    parser.add_argument('--kinds', default='', help='Optional comma-separated kinds: place,food,hotel,restaurant,experience')
    parser.add_argument('--photo-packs-only', action='store_true', help='Only process entries with reviewed food/hotel photo expansion mappings')
    parser.add_argument('--reviewed-places-only', action='store_true', help='Only repair places with an explicit exact-only image policy')
    parser.add_argument('--thumb-width', type=int, choices=[320, 400, 500, 640, 960], default=500, help='Requested width for new downloads; existing local images are retained')
    args = parser.parse_args()
    THUMB_WIDTH = args.thumb_width
    cities, items = inventory()
    if args.reviewed_places_only:
        items = [item for item in items if item['_kind'] == 'place' and item.get('imagePolicy') == 'exact-only']
    if args.photo_packs_only:
        selected = set()
        for directory in ('food-photo-expansion', 'hotel-photo-expansion'):
            for path in sorted((ROOT / 'data' / directory).glob('*.json')):
                selected.update(read(path, {}))
        items = [item for item in items if item['id'] in selected]
    if args.cities:
        selected = set(args.cities.split(','))
        cities = [city for city in cities if city['id'] in selected]
        items = [item for item in items if item['_city']['id'] in selected]
    if args.kinds:
        kinds = set(args.kinds.split(','))
        items = [item for item in items if item['_kind'] in kinds]
    media = read(OUTPUT, {'version': 1, 'cities': {}, 'attractions': {}})
    media['nearbyExcludedFiles'] = list(NEARBY_EXCLUSIONS)
    # Editorial corrections take precedence over an old successful download.
    # Never keep a known wrong dish photograph simply because its file exists.
    corrected = False
    for item in items:
        current = media['attractions'].get(item['id'])
        if not current or current.get('scope') == 'illustration':
            continue
        manual = item.get('photoFile') or item.get('imageFile')
        mismatch = manual and file_title(manual) != file_title(current.get('requestedFileTitle') or current.get('fileTitle'))
        unsuitable = item.get('photoStatus') == 'needs-food-photo' and not manual and not current.get('subjectMatched')
        unreviewed_identity = item.get('imagePolicy') == 'exact-only' and not (current.get('scope') == 'exact-place' and current.get('subjectMatched'))
        if mismatch or unsuitable or unreviewed_identity:
            del media['attractions'][item['id']]
            corrected = True
    if corrected:
        write(OUTPUT, media)
    for item in items:
        current = media['attractions'].get(item['id'])
        if current and current.get('scope') != 'illustration' and item.get('imageContextNote'):
            current['contextNote'] = item['imageContextNote']
            if item.get('imageScope') == 'nearby':
                current['scope'] = 'nearby'
            corrected = True
        if current and current.get('scope') == 'nearby' and '拍摄坐标' in current.get('contextNote', ''):
            current['contextNote'] = current['contextNote'].replace('拍摄坐标', '图片标注坐标')
            corrected = True
        if current and current.get('scope') == 'nearby' and (file_title(current.get('fileTitle')) in NEARBY_EXCLUSIONS or current.get('contextDistanceMeters') is not None and not scenery(current.get('fileTitle', ''), current.get('description', ''), current.get('capturedAt', ''))):
            del media['attractions'][item['id']]
            corrected = True
    if corrected:
        write(OUTPUT, media)
    excluded = set()
    for path in (ROOT / 'data').glob('*photo-overrides.json'):
        excluded.update(key for key, value in read(path, {}).items() if value is None)
    if args.phase in ('exact', 'all'):
        exact(items, media, excluded)
    if args.phase in ('nearby', 'all'):
        nearby(cities, items, media, excluded)
    if args.phase in ('fallback', 'all'):
        fallback(items, media)
    report = {'at': stamp(), 'items': len(items), 'exact': 0, 'nearby': 0, 'illustration': 0, 'missing': []}
    for item in items:
        photo = media['attractions'].get(item['id'])
        if not valid_photo(photo):
            report['missing'].append(item['id'])
        else:
            scope = photo.get('scope', 'exact-place')
            report['nearby' if scope == 'nearby' else 'illustration' if scope == 'illustration' else 'exact'] += 1
    write(CACHE / 'last-run.json', report)
    print(json.dumps({key: value if key != 'missing' else len(value) for key, value in report.items()}), flush=True)


if __name__ == '__main__':
    main()
