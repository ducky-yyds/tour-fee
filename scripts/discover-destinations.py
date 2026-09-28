"""Discover city/town candidates without silently publishing incomplete content.

Public Wikimedia APIs, resumable category continuations, no destination-count cap.
The registry is an editorial work queue, never a substitute for maintained cities.
"""
import argparse
import json
import os
import re
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'data/destination-registry.json'
SOURCES = [
    {'id': 'wikivoyage-en', 'language': 'en', 'category': 'Category:City articles'},
    {'id': 'wikivoyage-zh', 'language': 'zh', 'category': 'Category:城市条目'},
]


def load(path, default=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else default


def save(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def normalized(value):
    return re.sub(r'[^\w]', '', unicodedata.normalize('NFKC', value or '').casefold())


def refresh_maintained(registry):
    cities = load(ROOT / 'data/cities.json', [])
    experiences = load(ROOT / 'data/city-experiences.json', []) + load(ROOT / 'data/city-activities.json', [])
    for path in sorted((ROOT / 'data/experience-expansion').glob('*.json')):
        experiences.extend(load(path, []))
    foods = load(ROOT / 'data/local-foods.json', [])
    rows = registry['destinations']
    aliases = {}
    for row in rows:
        for alias in row.get('aliases', []):
            aliases.setdefault(normalized(alias), []).append(row)
    for city in cities:
        names = [city.get(k) for k in ('name', 'nameEn', 'article')] + city.get('aliases', [])
        matches = {row['id']: row for name in names if name for row in aliases.get(normalized(name), [])}
        candidates = [r for r in matches.values() if not r.get('cityId') or r['cityId'] == city['id']]
        row = next((r for r in rows if r.get('cityId') == city['id']), None)
        source_matches = [r for r in candidates if not r.get('cityId') and r.get('wikidataId')
                          and isinstance(r.get('lat'), (float, int)) and isinstance(r.get('lng'), (float, int))
                          and abs(r['lat'] - city['lat']) < 0.3 and abs(r['lng'] - city['lng']) < 0.3]
        if row and len({r['wikidataId'] for r in source_matches}) == 1:
            row['wikidataId'] = source_matches[0]['wikidataId']
        if row is None and len(candidates) == 1:
            row = candidates[0]
        if row is None:
            row = {'id': 'maintained:' + city['id'], 'sources': [], 'aliases': [], 'firstSeenAt': registry['updatedAt']}
            rows.append(row)
        activities = [e for e in experiences if e.get('cityId') == city['id'] and e.get('kind') == 'experience']
        food_count = sum(city['id'] in food.get('cityIds', []) for food in foods)
        hotels = sum(e.get('cityId') == city['id'] and e.get('kind') == 'hotel' for e in experiences)
        priority_reference = any(reference.get('categories') for reference in row.get('sources', []))
        tier = city.get('contentTier') or ('priority' if priority_reference else 'existing')
        minimum = {'priority': 25, 'standard': 10, 'existing': 20}[tier]
        min_exp = 5 if tier == 'priority' else 3
        missing = []
        if len(city.get('attractions', [])) + len(activities) < minimum:
            missing.append('attractions-and-experiences')
        if len(activities) < min_exp:
            missing.append('unique-experiences')
        if food_count < 5:
            missing.append('local-foods')
        if hotels < 5:
            missing.append('stays')
        row.update(cityId=city['id'], name=city['name'], countryCode=city['countryCode'], region=city['region'],
                   tier=tier, status='published-needs-enrichment' if missing else 'published',
                   scope='maintained-destination', lat=city['lat'], lng=city['lng'],
                   counts={'attractions': len(city.get('attractions', [])), 'experiences': len(activities), 'foods': food_count, 'stays': hotels},
                   missing=missing)
        row['aliases'] = sorted(set(row.get('aliases', []) + [n for n in names if n]))
        if city.get('wikidataId'):
            row['wikidataId'] = city['wikidataId']
    # Merge cross-language/canonical rows only with an exact Wikidata identity.
    by_wikidata = {}
    retained = []
    for row in sorted(rows, key=lambda r: (not bool(r.get('cityId')), r['id'])):
        qid = row.get('wikidataId')
        if qid and qid in by_wikidata:
            target = by_wikidata[qid]
            if row.get('cityId') and target.get('cityId') != row['cityId']:
                row['identityConflict'] = target['id']
                retained.append(row)
                continue
            target['aliases'] = sorted(set(target.get('aliases', []) + row.get('aliases', [])))
            sources = {s['url']: s for s in target.get('sources', []) + row.get('sources', [])}
            target['sources'] = list(sources.values())
        else:
            retained.append(row)
            if qid:
                by_wikidata[qid] = row
    registry['destinations'] = retained


def checkpoint(registry):
    refresh_maintained(registry)
    rows = registry['destinations']
    for provider, state in registry['sourceStates'].items():
        state['uniqueDestinationReferences'] = sum(any(s.get('provider') == provider for s in row.get('sources', [])) for row in rows)
    registry['summary'] = {
        'discovered': len(rows),
        'available': sum(bool(row.get('cityId')) for row in rows),
        'published': sum(bool(row.get('cityId')) for row in rows),
        'goalReady': sum(row['status'] == 'published' for row in rows),
        'publishedNeedsEnrichment': sum(row['status'] == 'published-needs-enrichment' for row in rows),
        'pending': sum(row['status'].startswith('pending') for row in rows),
        'excluded': sum(row['status'] == 'excluded' for row in rows),
        'sourceScansComplete': all(state.get('completedAt') for state in registry['sourceStates'].values()) and len(registry['sourceStates']) == len(SOURCES),
    }
    registry['summary']['globalCoverageComplete'] = (registry['summary']['sourceScansComplete'] and not registry['summary']['pending'] and not registry['summary']['publishedNeedsEnrichment'])
    save(REGISTRY, registry)
    save(ROOT / 'data/destination-coverage.json', {
        'version': 1, 'updatedAt': registry['updatedAt'], **registry['summary'],
        'sourceStates': registry['sourceStates'],
        'coverageMeaning': 'Available/published counts all maintained destinations visible in the application. goalReady counts those satisfying the target tier; upgrading a tier never removes an available city. These counts are not a source, image, price or licensing audit. Pending candidates are not visible destinations; city templates can also include parks/islands and need scope review.',
        'pendingBySource': {source['id']: sum(row['status'].startswith('pending') and any(s['provider'] == source['id'] for s in row['sources']) for row in rows) for source in SOURCES},
        'publishedByCountry': {country: sum(row.get('countryCode') == country and bool(row.get('cityId')) for row in rows) for country in sorted({row.get('countryCode') for row in rows if row.get('countryCode')})},
        'publishedByRegion': {region: sum(row.get('region') == region and bool(row.get('cityId')) for row in rows) for region in sorted({row.get('region') for row in rows if row.get('region')})},
    })


def enrich_wikidata(registry, session, end, limit):
    """Resolve identities/countries without generating editorial travel facts."""
    pending = [row for row in registry['destinations'] if row.get('wikidataId') and not row.get('identityCheckedAt')
               and (not row.get('identityRetryAfter') or datetime.fromisoformat(row['identityRetryAfter']).timestamp() < time.time())]
    pending.sort(key=lambda row: (row.get('tier') != 'priority', not bool(row.get('cityId')), row['id']))
    candidates = pending[:max(0, limit)]
    for offset in range(0, len(candidates), 50):
        if time.monotonic() >= end:
            break
        batch = candidates[offset:offset+50]
        try:
            response = session.get('https://www.wikidata.org/w/api.php', params={
                'action': 'wbgetentities', 'format': 'json', 'ids': '|'.join(row['wikidataId'] for row in batch),
                'props': 'labels|aliases|claims', 'languages': 'zh|en', 'languagefallback': 1, 'maxlag': 5,
            }, timeout=60)
            response.raise_for_status()
            payload = response.json()
            if payload.get('error'):
                raise RuntimeError(json.dumps(payload['error']))
            entities = payload.get('entities', {})
            related_ids = set()
            def claim_ids(entity, key):
                return [claim.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id')
                        for claim in entity.get('claims', {}).get(key, []) if claim.get('rank') != 'deprecated'
                        and isinstance(claim.get('mainsnak', {}).get('datavalue', {}).get('value'), dict)]
            for entity in entities.values():
                related_ids.update(claim_ids(entity, 'P17') + claim_ids(entity, 'P31'))
            related = {}
            identifiers = sorted(related_ids - {None})
            for start in range(0, len(identifiers), 50):
                r = session.get('https://www.wikidata.org/w/api.php', params={
                    'action': 'wbgetentities', 'format': 'json', 'ids': '|'.join(identifiers[start:start+50]),
                    'props': 'labels|claims', 'languages': 'en|zh', 'languagefallback': 1, 'maxlag': 5,
                }, timeout=60)
                r.raise_for_status()
                linked = r.json()
                if linked.get('error'):
                    raise RuntimeError(json.dumps(linked['error']))
                related.update(linked.get('entities', {}))
                time.sleep(.3)
            for row in batch:
                entity = entities.get(row['wikidataId'])
                if not entity or 'missing' in entity:
                    row['identityError'] = 'Wikidata entity missing; keep for editorial review'
                    row['identityRetryAfter'] = datetime.fromtimestamp(time.time() + 7 * 86400, timezone.utc).isoformat()
                    continue
                labels = entity.get('labels', {})
                row['aliases'] = sorted(set(row['aliases'] + [v['value'] for v in labels.values()]
                                            + [a['value'] for values in entity.get('aliases', {}).values() for a in values]))
                if not row.get('cityId'):
                    row['name'] = labels.get('zh', labels.get('en', {'value': row['name']}))['value']
                row['instanceOf'] = [{'id': identity, 'name': related.get(identity, {}).get('labels', {}).get('en', {'value': identity})['value']}
                                     for identity in claim_ids(entity, 'P31') if identity]
                countries = []
                for identity in claim_ids(entity, 'P17'):
                    if not identity:
                        continue
                    country = related.get(identity, {})
                    iso = next((claim.get('mainsnak', {}).get('datavalue', {}).get('value') for claim in country.get('claims', {}).get('P297', []) if claim.get('rank') != 'deprecated'), None)
                    countries.append({'wikidataId': identity, 'name': country.get('labels', {}).get('zh', country.get('labels', {}).get('en', {'value': identity}))['value'], 'code': iso})
                row['countryReferences'] = countries
                if len(countries) == 1 and countries[0]['code'] and not row.get('cityId'):
                    row['countryCode'] = countries[0]['code']
                    row['country'] = countries[0]['name']
                    row['missing'] = [item for item in row.get('missing', []) if item != 'country']
                names = [instance['name'].casefold() for instance in row['instanceOf']]
                if not row.get('cityId'):
                    if any(re.search(r'\b(airport|aerodrome)\b', name) for name in names):
                        row.update(status='excluded', scope='airport-only', exclusionReason='Airport-only article; retain as transport reference, not a tourism city.')
                    elif any(re.search(r'\b(island|national park|amusement park|archaeological site)\b', name) for name in names):
                        row.update(status='pending-gateway-assignment', scope='natural-or-site-destination', scopeNote='Attach to an appropriate gateway; travel value is not rejected.')
                    elif any(re.search(r'\b(city|town|village|municipality|capital)\b', name) for name in names):
                        row.update(status='pending-content', scope='city-or-town-reference')
                        row['missing'] = [item for item in row.get('missing', []) if item != 'scope-review']
                row['identityCheckedAt'] = datetime.now(timezone.utc).isoformat()
                reference = {'provider': 'wikidata', 'url': 'https://www.wikidata.org/wiki/' + row['wikidataId'], 'checkedAt': row['identityCheckedAt'][:10], 'scope': 'identity-country-and-instance', 'license': 'CC0'}
                row['sources'] = [s for s in row['sources'] if s['provider'] != 'wikidata'] + [reference]
            checkpoint(registry)
            print(json.dumps({'identityEnriched': offset + len(batch), **registry['summary']}), flush=True)
        except (requests.RequestException, ValueError, RuntimeError) as exc:
            registry['identityEnrichmentError'] = {'at': datetime.now(timezone.utc).isoformat(), 'message': str(exc)[:400]}
            checkpoint(registry)
            break


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--time-budget-seconds', type=int, default=1200)
    parser.add_argument('--offline', action='store_true', help='Reconcile maintained catalog without network requests')
    parser.add_argument('--refresh', action='store_true', help='Start a fresh source scan while retaining all known candidates')
    parser.add_argument('--enrich-limit', type=int, default=500, help='Resolve up to this many additional Wikidata identities per run; this is a run budget, not a catalog cap')
    parser.add_argument('--identity-only', action='store_true', help='Skip category scans; continue pending Wikidata identity/country enrichment')
    args = parser.parse_args()
    now = datetime.now(timezone.utc).isoformat()
    registry = load(REGISTRY, {'version': 1, 'destinations': [], 'sourceStates': {}})
    registry.setdefault('baselineCityIds', [city['id'] for city in load(ROOT / 'data/cities.json', [])])
    registry.update(updatedAt=now, scope='Cities and tourism towns; existing island destinations preserved; airport-only nodes excluded at scope review.',
                    sourceLicense='Wikivoyage article/category metadata; source URLs retained. Text extraction must preserve CC BY-SA attribution and license.',
                    completionRule='All in-scope candidates from completed dated source scans must be published; pending scope/content/photo reviews are never counted as complete.')
    refresh_maintained(registry)
    if args.offline:
        checkpoint(registry)
        print(json.dumps(registry['summary']))
        return
    session = requests.Session()
    session.headers['User-Agent'] = 'TourFeeCatalog/1.0 (https://github.com/ducky-yyds/tour-fee; public destination metadata)'
    end = time.monotonic() + max(1, args.time_budget_seconds)
    for source in ([] if args.identity_only else SOURCES):
        state = registry['sourceStates'].setdefault(source['id'], {})
        if args.refresh:
            state.clear()
        if state.get('completedAt'):
            continue
        state.setdefault('startedAt', now)
        state.update(language=source['language'], category=source['category'])
        endpoint = f"https://{source['language']}.wikivoyage.org/w/api.php"
        while time.monotonic() < end:
            parameters = {'action': 'query', 'format': 'json', 'generator': 'categorymembers', 'gcmtitle': source['category'],
                          'gcmnamespace': 0, 'gcmlimit': 500, 'prop': 'pageprops|coordinates|langlinks|categories',
                          'lllang': 'zh' if source['language'] == 'en' else 'en', 'lllimit': 500, 'colimit': 500,
                          'clcategories': 'Category:Guide cities|Category:Star cities|Category:指南城市|Category:明星城市',
                          'cllimit': 500, 'maxlag': 5, **state.get('continue', {})}
            try:
                response = session.get(endpoint, params=parameters, timeout=50)
                response.raise_for_status()
                payload = response.json()
                if payload.get('error'):
                    raise RuntimeError(json.dumps(payload['error']))
                current_ids = {row['id']: row for row in registry['destinations']}
                qids = {row['wikidataId']: row for row in registry['destinations'] if row.get('wikidataId')}
                for page in payload.get('query', {}).get('pages', {}).values():
                    if page.get('ns') != 0 or page.get('missing') is not None:
                        continue
                    qid = page.get('pageprops', {}).get('wikibase_item')
                    identity = f"{source['id']}:{page['pageid']}"
                    row = qids.get(qid) if qid else None
                    row = row or current_ids.get(identity)
                    if not row:
                        row = {'id': identity, 'name': page['title'], 'aliases': [], 'sources': [], 'status': 'pending-scope-and-content',
                               'scope': 'city-template-candidate', 'tier': 'standard', 'firstSeenAt': now,
                               'missing': ['scope-review', 'country', 'curated-content', 'local-foods', 'stays', 'reviewed-photos']}
                        registry['destinations'].append(row)
                        current_ids[identity] = row
                    if qid:
                        row['wikidataId'] = qid
                        qids[qid] = row
                    row['aliases'] = sorted(set(row.get('aliases', []) + [page['title']] + [link['*'] for link in page.get('langlinks', [])]))
                    categories = [cat['title'] for cat in page.get('categories', [])]
                    if categories and not row.get('cityId'):
                        row['tier'] = 'priority'
                        row['tierReason'] = 'Wikivoyage guide/star city category'
                    coordinates = page.get('coordinates', [])
                    if coordinates and not row.get('cityId'):
                        row.update(lat=coordinates[0]['lat'], lng=coordinates[0]['lon'])
                    reference = {'provider': source['id'], 'pageId': page['pageid'], 'title': page['title'],
                                 'url': f"https://{source['language']}.wikivoyage.org/wiki/" + requests.utils.quote(page['title'].replace(' ', '_'), safe=''),
                                 'checkedAt': now[:10], 'categories': categories}
                    row['sources'] = [s for s in row['sources'] if s.get('url') != reference['url']] + [reference]
                state['pagesProcessed'] = state.get('pagesProcessed', 0) + len(payload.get('query', {}).get('pages', {}))
                state['lastSuccessAt'] = datetime.now(timezone.utc).isoformat()
                state.pop('lastError', None)
                state['continue'] = payload.get('continue', {})
                if not state['continue']:
                    state['completedAt'] = state['lastSuccessAt']
                checkpoint(registry)
                print(json.dumps({'source': source['id'], 'pagesProcessed': state['pagesProcessed'], **registry['summary']}), flush=True)
                if state.get('completedAt'):
                    break
                time.sleep(0.3)
            except (requests.RequestException, ValueError, RuntimeError) as exc:
                state['lastError'] = str(exc)[:400]
                state['lastAttemptAt'] = datetime.now(timezone.utc).isoformat()
                checkpoint(registry)
                print(json.dumps({'source': source['id'], 'pendingError': state['lastError']}), flush=True)
                break
    enrich_wikidata(registry, session, end, args.enrich_limit)
    checkpoint(registry)


if __name__ == '__main__':
    main()
