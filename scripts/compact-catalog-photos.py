"""Replace large card assets with smaller Commons derivatives of the same file.

City covers are excluded. No pixels are edited locally; author, license and
subject are retained. Without --apply this only reports eligible local assets.
"""
import argparse
import concurrent.futures
import importlib.util
import json
import pathlib

spec = importlib.util.spec_from_file_location('catalog_media', pathlib.Path(__file__).with_name('complete-media.py'))
media_tools = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media_tools)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--max-images', type=int, default=80)
    parser.add_argument('--thumb-width', type=int, choices=[400, 500], default=500)
    args = parser.parse_args()
    if not 1 <= args.max_images <= 200:
        parser.error('--max-images must be between 1 and 200')
    manifest = media_tools.read(media_tools.OUTPUT)
    covers = {image.get('url') for image in manifest.get('cities', {}).values()}
    public = (media_tools.ROOT / 'public').resolve()
    candidates = {}
    for image in manifest.get('attractions', {}).values():
        url = image.get('url', '')
        if not url.startswith('/images/') or url in covers or image.get('width', 0) <= args.thumb_width * 1.25:
            continue
        if not image.get('fileTitle') or not image.get('sourceUrl', '').startswith('https://commons.wikimedia.org/wiki/File:'):
            continue
        local = (public / url.lstrip('/')).resolve()
        if local.parent != public / 'images' or not local.is_file() or local.stat().st_size <= 160 * 1024:
            continue
        candidates[url] = {'url': url, 'path': local, 'file': media_tools.file_title(image['fileTitle']), 'bytes': local.stat().st_size}
    selected = sorted(candidates.values(), key=lambda row: -row['bytes'])[:args.max_images]
    report = {'at': media_tools.stamp(), 'eligible': len(candidates), 'selected': len(selected), 'updated': [], 'skipped': [], 'savedBytes': 0}
    if not args.apply:
        print(json.dumps({**report, 'selectedBytes': sum(row['bytes'] for row in selected)}))
        return

    def download(row, info):
        remote = info.get('thumburl')
        if not remote:
            raise ValueError('No smaller derivative')
        body = media_tools.request(remote, binary=True)
        suffix = row['path'].suffix.lower()
        if suffix in ('.jpg', '.jpeg') and body[:3] != b'\xff\xd8\xff' or suffix == '.png' and body[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('Derivative encoding differs from the existing public URL')
        if len(body) >= row['bytes'] * .9:
            raise ValueError('No material size reduction')
        return body

    for start in range(0, len(selected), 20):
        batch = selected[start:start + 20]
        try:
            result = media_tools.api({'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': args.thumb_width,
                                      'redirects': 1, 'titles': '|'.join('File:' + row['file'] for row in batch)})
            aliases = {media_tools.file_title(row['from']): media_tools.file_title(row['to']) for row in result.get('query', {}).get('normalized', []) + result.get('query', {}).get('redirects', [])}
            metadata = {media_tools.file_title(page['title']): (page.get('imageinfo') or [{}])[0] for page in result.get('query', {}).get('pages', {}).values()}
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                jobs = {}
                for row in batch:
                    canonical = row['file']
                    for _ in range(8):
                        if canonical not in aliases:
                            break
                        canonical = aliases[canonical]
                    info = metadata.get(canonical, {})
                    if not media_tools.usable(info, canonical):
                        report['skipped'].append({'url': row['url'], 'reason': 'No usable licensed derivative'})
                        continue
                    jobs[executor.submit(download, row, info)] = (row, info)
                for future in concurrent.futures.as_completed(jobs):
                    row, info = jobs[future]
                    try:
                        body = future.result()
                        temporary = row['path'].with_suffix(row['path'].suffix + '.tmp')
                        temporary.write_bytes(body)
                        temporary.replace(row['path'])
                        for image in manifest['attractions'].values():
                            if image.get('url') == row['url']:
                                image.update({'remoteUrl': info['thumburl'], 'bytes': len(body), 'preferredWidth': args.thumb_width,
                                              'width': info.get('thumbwidth'), 'height': info.get('thumbheight'),
                                              'checkedAt': media_tools.stamp()})
                        report['savedBytes'] += row['bytes'] - len(body)
                        report['updated'].append(row['url'])
                    except Exception as error:
                        report['skipped'].append({'url': row['url'], 'reason': str(error)})
        except Exception as error:
            report['skipped'].append({'batch': start, 'reason': str(error)})
        manifest['updatedAt'] = media_tools.stamp()
        media_tools.write(media_tools.OUTPUT, manifest)
        print(json.dumps({'processed': min(start + 20, len(selected)), 'updated': len(report['updated']), 'savedMiB': round(report['savedBytes'] / 1048576, 2)}), flush=True)
    media_tools.write(media_tools.ROOT / 'artifacts/catalog-photo-compaction.json', report)


if __name__ == '__main__':
    main()
