"""Preserve this expansion's published bytes and recover the corresponding source originals.

Repeat after another reviewed photo batch: completed originals are not downloaded again.
The general archive inventory still owns the full project's version history.
"""
import json
from pathlib import Path
import sys

import archive_assets

ROOT = Path(__file__).resolve().parents[1]
media = archive_assets.read_json(ROOT / 'data/media.json')
city_ids = {city['id'] for part in ('north', 'east', 'west')
            for city in archive_assets.read_json(ROOT / f'data/expansion/china-{part}-20261007.json')}
entity_ids = set()
for kind in ('place', 'experience', 'food', 'hotel'):
    for pack in (ROOT / 'data' / f'{kind}-photo-expansion').glob('china-*-20261007.json'):
        entity_ids.update(archive_assets.read_json(pack))
records = [media['cities'].get(city_id, {}) for city_id in city_ids]
records += [media['attractions'].get(entity_id, {}) for entity_id in entity_ids]
urls = sorted({record['url'] for record in records
               if record.get('url', '').startswith('/images/') and record.get('scope') != 'illustration'})
if not urls:
    raise SystemExit('No reviewed local batch photos to archive')
print(json.dumps({'batchPhotos': len(urls), **archive_assets.preserve_media_urls(urls)}), flush=True)
sys.argv = [__file__, '--download', '--only', ','.join('public:' + url.lstrip('/') for url in urls),
            '--limit', '0', '--workers', '3', '--delay', '0.4']
archive_assets.main()
