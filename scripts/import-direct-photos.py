"""Import reviewed, openly licensed Flickr food/hotel photographs.

--preview only caches pictures under artifacts for visual subject review.
Publishing requires visualReviewRequired=false in the source pack. A single
writer updates media.json; source/author/license stay attached to every image.
"""
import argparse
import hashlib
import importlib.util
import json
import pathlib
import re
import urllib.parse

spec = importlib.util.spec_from_file_location('media_tools', pathlib.Path(__file__).with_name('complete-media.py'))
media_tools = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media_tools)
ROOT = media_tools.ROOT

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pack')
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--missing-only', action='store_true', help='Keep existing local photos from the same reviewed source')
    args = parser.parse_args()
    candidates = media_tools.read(pathlib.Path(args.pack), {})
    _, items = media_tools.inventory()
    known = {item['id']: item for item in items if item['_kind'] in ('food', 'hotel')}
    manifest = media_tools.read(media_tools.OUTPUT)
    result = {'preview': args.preview, 'imported': [], 'kept': 0, 'failed': []}
    for item_id, row in candidates.items():
        try:
            if item_id not in known:
                raise ValueError('Not a catalog food/hotel')
            remote = urllib.parse.urlparse(row['remoteUrl'])
            source = urllib.parse.urlparse(row['sourceUrl'])
            if remote.scheme != 'https' or not (remote.hostname or '').endswith('.staticflickr.com') or source.scheme != 'https' or source.hostname not in ('www.flickr.com', 'flickr.com'):
                raise ValueError('Unsupported photographic source')
            if not re.fullmatch(r'CC BY(?:-SA)? (?:2\.0|3\.0|4\.0)|CC0|Public domain', row.get('license', ''), re.I):
                raise ValueError('Unsupported license')
            if not row.get('licenseUrl', '').startswith('https://') or not (row.get('artist') or row.get('author')):
                raise ValueError('Missing attribution')
            if not args.preview and row.get('visualReviewRequired', True):
                raise ValueError('Visual subject review not complete')
            current = manifest['attractions'].get(item_id)
            if args.missing_only and not args.preview and media_tools.valid_photo(current) and current.get('sourceUrl') == row['sourceUrl'] and current.get('license') == row['license']:
                result['kept'] += 1
                continue
            name = 'flickr-' + hashlib.sha256(row['sourceUrl'].encode()).hexdigest()[:20] + '.jpg'
            cache = ROOT/'artifacts/direct-photo-preview'/name
            if not cache.exists():
                body = media_tools.request(row['remoteUrl'], binary=True)
                if body[:3] != b'\xff\xd8\xff':
                    raise ValueError('Expected JPEG')
                cache.parent.mkdir(parents=True, exist_ok=True)
                cache.write_bytes(body)
            if not args.preview:
                target = ROOT/'public/images'/name
                target.write_bytes(cache.read_bytes())
                manifest['attractions'][item_id] = {
                    'url': '/images/' + name, 'alt': row.get('title') or known[item_id]['name'],
                    'scope': 'exact-place', 'subjectMatched': True,
                    'credit': row.get('artist') or row['author'], 'sourceUrl': row['sourceUrl'],
                    'license': row['license'], 'licenseUrl': row['licenseUrl'],
                    'attributionUrl': row.get('attributionUrl'), 'remoteUrl': row['remoteUrl'],
                    'description': row.get('identityEvidence') or row.get('note'),
                    'contextNote': row.get('imageContextNote') or row.get('note'),
                    'checkedAt': media_tools.stamp(), 'sourceCheckedAt': row.get('checkedAt'),
                    'width': row.get('width'), 'height': row.get('height'), 'bytes': target.stat().st_size,
                    'modifications': 'Flickr display derivative; interface may crop the image to fit. License retained.',
                }
            result['imported'].append({'id': item_id, 'filename': name})
        except Exception as error:
            result['failed'].append({'id': item_id, 'reason': str(error)})
    if not args.preview:
        manifest['updatedAt'] = media_tools.stamp()
        media_tools.write(media_tools.OUTPUT, manifest)
    media_tools.write(ROOT/'artifacts/direct-photo-preview/last-run.json', result)
    print(json.dumps(result, ensure_ascii=False))
    if result['failed']:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
