"""Preserve local media bytes and recover verified Commons originals, without changing web assets."""
import argparse
import contextlib
import concurrent.futures
import copy
import datetime as dt
import email.utils
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import shutil
import socket
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
VERSION = 1
USER_AGENT = 'TourFeeAssetArchive/1.0 (https://github.com/ducky-yyds/tour-fee; source attribution retained)'
PROVENANCE_KEYS = ('sourceUrl', 'remoteUrl', 'originalUrl', 'originalPath', 'sourcePath', 'fileTitle',
                   'photoFile', 'credit', 'author', 'artist', 'license', 'licenseUrl', 'generator', 'prompt',
                   'width', 'height', 'bytes', 'modifications', 'checkedAt', 'imageScope', 'imageContextNote')
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.avif', '.svg'}
HTTP_GATE = threading.Lock()
HTTP_NEXT = {}


def stamp():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def read_json(file, default=None):
    try:
        return json.loads(Path(file).read_text('utf-8-sig'))
    except FileNotFoundError:
        return default


def atomic_json(file, value):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=file.parent, suffix='.tmp', delete=False) as stream:
        temporary = Path(stream.name)
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())
    try:
        os.replace(temporary, file)
    finally:
        temporary.unlink(missing_ok=True)


def sha256(file):
    digest = hashlib.sha256()
    with Path(file).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def within(parent, child):
    try:
        Path(child).resolve().relative_to(Path(parent).resolve())
        return True
    except ValueError:
        return False


def process_alive(pid):
    if not isinstance(pid, int) or isinstance(pid, bool) or pid <= 0 or (os.name == 'nt' and pid > 0xFFFFFFFF):
        return None
    if os.name == 'nt':
        # os.kill(pid, 0) is NOT a portable Windows liveness probe.
        import ctypes
        from ctypes import wintypes
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.OpenProcess.argtypes = (wintypes.DWORD, wintypes.BOOL, wintypes.DWORD)
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.GetExitCodeProcess.argtypes = (wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD))
        kernel.GetExitCodeProcess.restype = wintypes.BOOL
        kernel.CloseHandle.argtypes = (wintypes.HANDLE,)
        handle = kernel.OpenProcess(0x1000, False, pid)
        if not handle:
            return False if ctypes.get_last_error() == 87 else None
        try:
            code = wintypes.DWORD()
            if not kernel.GetExitCodeProcess(handle, ctypes.byref(code)):
                return None
            return code.value == 259
        finally:
            kernel.CloseHandle(handle)
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except (PermissionError, OSError):
        return None


def media_directory():
    configured = Path(os.environ.get('MEDIA_ROOT', str(ROOT / 'public/images'))).expanduser()
    return (ROOT / configured).resolve() if not configured.is_absolute() else configured.resolve()


@contextlib.contextmanager
def archive_lock(directory):
    directory = Path(directory).resolve()
    if within(ROOT, directory) and not within(ROOT / 'storage', directory):
        raise ValueError('In-project archives must stay under storage/, separate from source and public assets')
    directory.mkdir(parents=True, exist_ok=True)
    lock = directory / '.archive.lock'
    token = os.urandom(16).hex()
    for attempt in range(2):
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            break
        except FileExistsError:
            try:
                before = lock.stat()
                owner = read_json(lock)
                same_host = owner and str(owner.get('host', '')).casefold() == socket.gethostname().casefold()
                after = lock.stat()
                unchanged = (before.st_ino, before.st_mtime_ns, before.st_size) == (after.st_ino, after.st_mtime_ns, after.st_size)
                if attempt == 0 and same_host and process_alive(owner.get('pid')) is False and unchanged:
                    stale = directory / 'lock-history' / f'archive-{time.time_ns()}-{owner["pid"]}.json'
                    stale.parent.mkdir(exist_ok=True)
                    os.rename(lock, stale)
                    continue
            except (FileNotFoundError, ValueError, OSError):
                pass
            raise RuntimeError('Asset archive is locked by a live, remote, or unverified process; refusing to steal it.') from None
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            json.dump({'pid': os.getpid(), 'host': socket.gethostname(), 'startedAt': stamp(), 'token': token}, stream)
        yield
    finally:
        current = read_json(lock)
        if current and current.get('token') == token:
            lock.unlink(missing_ok=True)


def file_dimensions(file):
    try:
        from PIL import Image
        with Image.open(file) as picture:
            return {'width': picture.width, 'height': picture.height,
                    'mimeType': Image.MIME.get(picture.format, mimetypes.guess_type(file.name)[0])}
    except Exception:
        # Metadata extraction is optional; even unsupported/very large sources
        # must retain their exact bytes. Originals also carry API dimensions.
        return {'mimeType': mimetypes.guess_type(file.name)[0] or 'application/octet-stream'}


def blob(directory, file, role='available-copy', **metadata):
    digest = sha256(file)
    suffix = Path(file).suffix.lower()
    if not re.fullmatch(r'\.[a-z0-9]{1,10}', suffix):
        suffix = '.bin'
    destination = directory / 'blobs' / digest[:2] / (digest + suffix)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if sha256(destination) != digest:
            raise RuntimeError('An immutable archive blob failed its integrity check; refusing to overwrite it.')
    else:
        fd, name = tempfile.mkstemp(dir=destination.parent, suffix='.tmp')
        os.close(fd)
        temporary = Path(name)
        try:
            shutil.copyfile(file, temporary)
            with temporary.open('rb+') as durable:
                os.fsync(durable.fileno())
            if sha256(temporary) != digest:
                raise RuntimeError('Source changed during archiving; try again after media maintenance finishes.')
            os.replace(temporary, destination)
        finally:
            temporary.unlink(missing_ok=True)
    dimensions = {} if metadata.get('width') and metadata.get('height') and metadata.get('mimeType') else file_dimensions(file)
    return {'sha256': digest, 'path': destination.relative_to(directory).as_posix(),
            'bytes': destination.stat().st_size, 'role': role, 'archivedAt': stamp(),
            **dimensions, **metadata}


def new_asset(key):
    return {'id': key, 'localPaths': [], 'references': [], 'provenance': [], 'currentProvenance': [], 'versions': [], 'status': 'missing'}


def remember_version(asset, version):
    def same_version(previous):
        if previous['sha256'] != version['sha256'] or previous['role'] != version['role']:
            return False
        if version['role'] == 'source-original':
            previous_title = previous.get('sourceTitle') or previous.get('sourceRevision', {}).get('canonicalTitle')
            return previous_title == (version.get('sourceTitle') or version.get('sourceRevision', {}).get('canonicalTitle'))
        return True
    existing = next((v for v in asset['versions'] if same_version(v)), None)
    if existing is None:
        asset['versions'].append(version)
    else:
        # Older manifest records can gain source identity without changing the
        # retained bytes or original archival timestamp.
        for field in ('sourceTitle', 'sourceRevision', 'sourceMetadata', 'generation'):
            if field not in existing and field in version:
                existing[field] = version[field]
    refresh_asset_status(asset)


def refresh_asset_status(asset):
    title = commons_title(asset)
    available = [v for v in asset['versions'] if v['role'] == 'generated-original' or
                 (v['role'] == 'source-original' and (not title or
                  (v.get('sourceTitle') or v.get('sourceRevision', {}).get('canonicalTitle')) == title))]
    asset['status'] = 'original' if available else 'available-copy' if asset['versions'] else 'missing'
    if asset['versions']:
        best = max(available or asset['versions'], key=lambda v: (v.get('sourceRevision', {}).get('timestamp', ''),
                   (v.get('width') or 0) * (v.get('height') or 0), v['bytes']))
        asset['preferredSha256'] = best['sha256']


def walk_records(value, parts=()):
    if isinstance(value, dict):
        url = value.get('url')
        if isinstance(url, str) and url.startswith('/') and not url.startswith('//'):
            yield parts, value
        for key, child in value.items():
            yield from walk_records(child, parts + (str(key),))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk_records(child, parts + (str(index),))


def add_unique(items, value):
    if value not in items:
        items.append(value)


def load_manifest(directory):
    manifest = read_json(directory / 'manifest.json', {'schemaVersion': VERSION, 'createdAt': stamp(), 'assets': {}})
    if manifest.get('schemaVersion') != VERSION:
        raise RuntimeError('Unsupported asset manifest version')
    journal = directory / 'recovery-journal.jsonl'
    if journal.exists():
        lines = journal.read_bytes().splitlines(keepends=True)
        for index, line in enumerate(lines):
            try:
                event = json.loads(line)
            except (ValueError, UnicodeError):
                if index == len(lines) - 1 and not line.endswith(b'\n'):
                    break  # An interrupted final append never invalidates earlier committed recoveries.
                raise RuntimeError('Original recovery journal is corrupt') from None
            asset = manifest['assets'].setdefault(event['assetId'], new_asset(event['assetId']))
            if event.get('version'):
                remember_version(asset, event['version'])
            if event['recovery']['attemptedAt'] >= asset.get('recovery', {}).get('attemptedAt', ''):
                asset['recovery'] = event['recovery']
    return manifest


def summarize(manifest):
    assets = manifest['assets'].values()
    unique = {version['path']: version for asset in assets for version in asset['versions']}
    return {'assets': len(manifest['assets']), 'original': sum(a['status'] == 'original' for a in assets),
            'availableCopy': sum(a['status'] == 'available-copy' for a in assets),
            'missing': sum(a['status'] == 'missing' for a in assets), 'uniqueBlobs': len(unique),
            'archivedBytes': sum(v['bytes'] for v in unique.values()),
            'needsOriginalRecovery': sum(a['status'] != 'original' for a in assets),
            'commonsRecoveryPending': sum(bool(commons_title(a)) and a['status'] != 'original' for a in assets)}


def save_manifest(directory, manifest):
    manifest['updatedAt'] = stamp()
    manifest['summary'] = summarize(manifest)
    atomic_json(directory / 'manifest.json', manifest)
    # Checkpoint first, clear the append-only journal second. Replaying an old
    # event after an interruption is idempotent.
    journal = directory / 'recovery-journal.jsonl'
    if journal.exists():
        with journal.open('wb') as stream:
            stream.flush()
            os.fsync(stream.fileno())


def save_recovery(directory, asset, version=None):
    event = {'assetId': asset['id'], 'recovery': asset['recovery']}
    if version:
        event['version'] = version
    with (directory / 'recovery-journal.jsonl').open('ab') as stream:
        stream.write((json.dumps(event, ensure_ascii=False) + '\n').encode('utf-8'))
        stream.flush()
        os.fsync(stream.fileno())


def archive_generated_original(source, public_url, provenance):
    """Call BEFORE encoding an imagegen output; preserves explicit source bytes and prompt."""
    directory = Path(os.environ.get('ASSET_ARCHIVE_DIR', str(ROOT / 'storage/originals'))).resolve()
    if not public_url.startswith('/images/') or '..' in Path(public_url).parts:
        raise ValueError('Generated artwork must identify its public image URL')
    with archive_lock(directory):
        manifest = load_manifest(directory)
        key = 'public:' + public_url.lstrip('/')
        asset = manifest['assets'].setdefault(key, new_asset(key))
        add_unique(asset['provenance'], provenance)
        add_unique(asset['currentProvenance'], provenance)
        add_unique(asset['localPaths'], 'public/' + public_url.lstrip('/'))
        remember_version(asset, blob(directory, Path(source), 'generated-original',
                                    archivedFrom=Path(source).name, generation=provenance))
        save_manifest(directory, manifest)


def preserve_media_urls(urls, records=None, metadata_files=None, archive_directory=None):
    """Short transaction for manual downloaders, before/after overwriting named derivatives.

    records may supply already assembled provenance as {url: record}; otherwise
    read the authoritative media manifests. Never hold the lock across network IO.
    """
    from media_paths import media_path
    targets = {}
    for url in urls:
        file = media_path(url)
        if file is None:
            raise ValueError('Only safe /images/... URLs can be preserved')
        if file.is_file():
            targets[url] = file
    if not targets:
        return {'preserved': 0, 'absent': len(urls)}
    directory = Path(archive_directory or os.environ.get('ASSET_ARCHIVE_DIR', str(ROOT / 'storage/originals'))).resolve()
    gathered = {url: [] for url in targets}
    if records is not None:
        for url, record in records.items():
            if url in gathered and record and record.get('url') == url:
                gathered[url].append((record.get('recordFile', 'data/media.json'), record.get('recordKey', ''), record))
    else:
        for path in metadata_files or [ROOT / 'data/media.json', ROOT / 'data/routine-media.json']:
            path = Path(path)
            source_name = path.relative_to(ROOT).as_posix() if within(ROOT, path) else str(path)
            for keys, record in walk_records(read_json(path, {})):
                if record['url'] in gathered:
                    gathered[record['url']].append((source_name, '/'.join(keys), record))
    with archive_lock(directory):
        manifest = load_manifest(directory)
        for url, file in targets.items():
            key = 'public:' + url.lstrip('/')
            asset = manifest['assets'].setdefault(key, new_asset(key))
            add_unique(asset['localPaths'], 'public/' + url.lstrip('/'))
            if gathered[url]:
                asset['currentProvenance'] = []
                for source, record_key, record in gathered[url]:
                    provenance = {k: record[k] for k in PROVENANCE_KEYS if record.get(k) is not None}
                    provenance['recordFile'] = source
                    add_unique(asset['provenance'], provenance)
                    add_unique(asset['currentProvenance'], provenance)
                    add_unique(asset['references'], {'file': source, 'key': record_key})
            remember_version(asset, blob(directory, file, archivedFrom='public/' + url.lstrip('/')))
            asset['localPresent'] = True
        save_manifest(directory, manifest)
    return {'preserved': len(targets), 'absent': len(urls) - len(targets)}


def inventory(directory, manifest):
    """All current public assets plus metadata references; old entries and byte versions are retained."""
    public = ROOT / 'public'
    served_images = media_directory()
    if within(directory, served_images) or within(served_images, directory):
        raise ValueError('MEDIA_ROOT and ASSET_ARCHIVE_DIR must not overlap')
    assets = manifest['assets']
    for asset in assets.values():
        asset['currentProvenance'] = []
    for file in sorted((ROOT / 'data').rglob('*.json')):
        document = read_json(file)
        for keys, record in walk_records(document):
            url = urllib.parse.unquote(urllib.parse.urlsplit(record['url']).path)
            local = (public / url.lstrip('/')).resolve()
            if not within(public, local) or 'static-data' in local.relative_to(public).parts:
                continue
            key = 'public:' + local.relative_to(public).as_posix()
            asset = assets.setdefault(key, new_asset(key))
            add_unique(asset['references'], {'file': file.relative_to(ROOT).as_posix(), 'key': '/'.join(keys)})
            provenance = {k: record[k] for k in PROVENANCE_KEYS if record.get(k) is not None}
            provenance['recordFile'] = file.relative_to(ROOT).as_posix()
            add_unique(asset['provenance'], provenance)
            add_unique(asset['currentProvenance'], provenance)
            add_unique(asset['localPaths'], local.relative_to(ROOT).as_posix())
    processed = 0
    for file in sorted(public.rglob('*')):
        if not file.is_file() or file.is_symlink() or not within(public, file) or 'static-data' in file.relative_to(public).parts:
            continue
        key = 'public:' + file.relative_to(public).as_posix()
        asset = assets.setdefault(key, new_asset(key))
        add_unique(asset['localPaths'], file.relative_to(ROOT).as_posix())
        if file.parent in (public / 'maps', public / 'flags'):
            for document in file.parent.iterdir():
                if document.is_file() and (document.suffix.lower() == '.md' or 'LICENSE' in document.name):
                    add_unique(asset.setdefault('sourceDocuments', []), document.relative_to(ROOT).as_posix())
        remember_version(asset, blob(directory, file, archivedFrom=file.relative_to(ROOT).as_posix()))
        processed += 1
        if processed % 1000 == 0:
            print(json.dumps({'phase': 'inventory-progress', 'files': processed}), flush=True)
    if served_images != (public / 'images').resolve():
        for file in sorted(served_images.rglob('*')):
            if not file.is_file() or file.is_symlink() or not within(served_images, file):
                continue
            relative = file.relative_to(served_images).as_posix()
            public_path = 'public/images/' + relative
            key = 'public:images/' + relative
            asset = assets.setdefault(key, new_asset(key))
            add_unique(asset['localPaths'], public_path)
            add_unique(asset.setdefault('sourceLocations', []), {'publicPath': public_path, 'sourcePath': str(file)})
            remember_version(asset, blob(directory, file, archivedFrom=public_path, sourceLocation=str(file)))
    # Recover the known historical imagegen output folder; arbitrary generated-*
    # folders are only candidates, because they may also contain resized previews.
    for folder in sorted((ROOT / 'artifacts').glob('generated-*')):
        if not folder.is_dir():
            continue
        for file in sorted(folder.rglob('*')):
            if not file.is_file() or file.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            matched = [a for a in assets.values() if any(
                p.get('generator') and any(r['key'].split('/')[-1] == file.stem for r in a['references'])
                for p in a['provenance'])]
            if not matched:
                key = 'generated:' + file.relative_to(ROOT).as_posix()
                matched = [assets.setdefault(key, new_asset(key))]
            role = 'generated-original' if folder.name == 'generated-food-cityrepair' and matched[0]['id'].startswith('public:') else 'available-copy'
            version = blob(directory, file, role, archivedFrom=file.relative_to(ROOT).as_posix())
            for asset in matched:
                add_unique(asset['localPaths'], file.relative_to(ROOT).as_posix())
                remember_version(asset, version)
    for asset in assets.values():
        asset['localPresent'] = any((served_images / name.removeprefix('public/images/')).is_file()
                                   if name.startswith('public/images/') else (ROOT / name).is_file()
                                   for name in asset['localPaths'])
        asset['lastInventoryAt'] = stamp()
        refresh_asset_status(asset)
    save_manifest(directory, manifest)
    return manifest['summary']


def safe_remote(url):
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != 'https' or parts.username or parts.password or not parts.hostname or parts.hostname in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Only public HTTPS source URLs without credentials are allowed')
    return url


def open_remote(url, tries=3):
    request = urllib.request.Request(safe_remote(url), headers={'User-Agent': USER_AGENT})
    host = urllib.parse.urlsplit(url).hostname
    for attempt in range(tries):
        while True:
            with HTTP_GATE:
                delay = HTTP_NEXT.get(host, 0) - time.monotonic()
                if delay <= 0:
                    HTTP_NEXT[host] = time.monotonic() + 0.3
                    break
            time.sleep(min(delay, 5))
        try:
            # urllib respects HTTPS_PROXY / HTTP_PROXY and the Windows system proxy.
            return urllib.request.urlopen(request, timeout=45)
        except urllib.error.HTTPError as error:
            retry_after = error.headers.get('Retry-After', '0')
            try:
                delay = float(retry_after)
            except ValueError:
                try:
                    delay = email.utils.parsedate_to_datetime(retry_after).timestamp() - time.time()
                except (ValueError, TypeError, OverflowError):
                    delay = 0
            delay = max(2 ** attempt, delay)
            if error.code in (429, 503):
                # A source-wide cooldown also slows the other two workers.
                with HTTP_GATE:
                    HTTP_NEXT[host] = max(HTTP_NEXT.get(host, 0), time.monotonic() + delay)
            if error.code not in (429, 500, 502, 503, 504) or attempt == tries - 1:
                raise RuntimeError(f'Source HTTP {error.code}') from None
            time.sleep(min(delay, 5))
        except (urllib.error.URLError, TimeoutError, OSError):
            if attempt == tries - 1:
                raise RuntimeError('Source connection failed after retries') from None
            time.sleep(2 ** attempt)


def commons_title(asset):
    # Current main manifests take priority over historical source packs.
    rows = sorted(asset.get('currentProvenance', asset['provenance']), key=lambda p: p.get('recordFile') in ('data/media.json', 'data/routine-media.json'), reverse=True)
    for record in rows:
        source = record.get('sourceUrl', '')
        if not isinstance(source, str):
            continue
        if urllib.parse.urlsplit(source).hostname != 'commons.wikimedia.org':
            continue
        title = record.get('fileTitle') or record.get('photoFile')
        if not title and '/wiki/File:' in source:
            title = urllib.parse.unquote(source.split('/wiki/File:', 1)[1].split('?', 1)[0])
        if title:
            return 'File:' + str(title).removeprefix('File:').replace('_', ' ')
    return None


def commons_info(directory, title, refresh=False):
    cache = directory / 'source-api-cache' / (hashlib.sha256(title.encode()).hexdigest() + '.json')
    saved = read_json(cache)
    if saved and not refresh and time.time() - cache.stat().st_mtime < 30 * 86400:
        return saved['info']
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'titles': title,
        'iiprop': 'url|size|sha1|timestamp|mime|extmetadata', 'redirects': 1, 'maxlag': 5,
    })
    with open_remote(url) as response:
        raw = response.read(5 * 1024 * 1024)
    document = json.loads(raw)
    if document.get('error'):
        raise RuntimeError('Commons API ' + str(document['error'].get('code', 'error')))
    pages = list(document.get('query', {}).get('pages', {}).values())
    page = next((p for p in pages if p.get('imageinfo')), None)
    if not page:
        raise RuntimeError('No Commons original found')
    info = {**page['imageinfo'][0], 'canonicalTitle': page['title'], 'pageid': page['pageid']}
    atomic_json(cache, {'checkedAt': stamp(), 'requestedTitle': title, 'info': info})
    return info


def recover_original(directory, asset, refresh=False, max_bytes=256 * 1024 * 1024):
    title = commons_title(asset)
    if not title:
        raise RuntimeError('No verifiable original endpoint; retain available copy')
    info = commons_info(directory, title, refresh)
    url = info.get('url', '')
    if '/thumb/' in url or not url.startswith('https://upload.wikimedia.org/'):
        raise RuntimeError('Commons did not return an original file URL')
    if not info.get('size') or info['size'] > max_bytes:
        raise RuntimeError('Original exceeds configured download size or size is unknown')
    # No guessed full-size URLs or inferred originals: verify API byte size AND source SHA-1.
    expected_sha1 = info.get('sha1', '')
    if not re.fullmatch(r'[0-9a-f]{40}', expected_sha1):
        raise RuntimeError('Source SHA-1 is missing; original is not verifiable')
    suffix = Path(urllib.parse.unquote(urllib.parse.urlsplit(url).path)).suffix.lower()
    staging = directory / 'incoming'
    staging.mkdir(exist_ok=True)
    fd, name = tempfile.mkstemp(dir=staging, suffix=suffix)
    temporary = Path(name)
    try:
        size = 0
        digest = hashlib.sha1()
        with os.fdopen(fd, 'wb') as target, open_remote(url) as response:
            content_type = response.headers.get('Content-Type', '').split(';')[0]
            if content_type in ('text/html', 'application/json'):
                raise RuntimeError('Source returned a page instead of original media')
            for chunk in iter(lambda: response.read(256 * 1024), b''):
                size += len(chunk)
                if size > max_bytes:
                    raise RuntimeError('Original exceeds configured download size')
                digest.update(chunk)
                target.write(chunk)
        if size != info['size'] or digest.hexdigest() != expected_sha1:
            if not refresh:
                # Commons may have uploaded a new revision since the metadata
                # cache was written. Re-resolve once instead of pinning a stale
                # size/SHA-1 for the entire cache lifetime.
                return recover_original(directory, asset, True, max_bytes)
            raise RuntimeError('Original changed or download was incomplete; size/SHA-1 mismatch')
        source_revision = {'timestamp': info.get('timestamp'), 'sha1': expected_sha1,
                           'pageid': info.get('pageid'), 'canonicalTitle': info.get('canonicalTitle')}
        version = blob(directory, temporary, 'source-original', sourceUrl=url, sourceRevision=source_revision,
                       sourceTitle=title,
                       width=info.get('width'), height=info.get('height'), mimeType=info.get('mime'),
                       sourceMetadata=info.get('extmetadata', {}))
        remember_version(asset, version)
        return version
    finally:
        temporary.unlink(missing_ok=True)


def download(directory, manifest, args):
    only = set(args.only.split(',')) if args.only else set()
    pending = [a for a in manifest['assets'].values() if commons_title(a)
               and (args.refresh or a['status'] != 'original')
               and (not only or a['id'] in only or any(Path(p).stem in only for p in a['localPaths']))]
    # Failures are retried later; sorting by last attempt prevents a permanently broken first file starving the queue.
    pending.sort(key=lambda a: (a.get('recovery', {}).get('attemptedAt', ''), a['id']))
    selected = pending if args.limit == 0 else pending[:args.limit]
    report = {'pending': len(pending), 'attempted': 0, 'recovered': 0, 'failed': 0}
    # Replay and checkpoint any earlier interrupted journal before new appends.
    save_manifest(directory, manifest)
    stop_file = directory / '.stop-after-current'

    def recover(asset):
        working = copy.deepcopy(asset)
        try:
            version = recover_original(directory, working, args.refresh, args.max_bytes)
            return version, {'attemptedAt': stamp(), 'state': 'complete', 'sha256': version['sha256']}
        except Exception as error:
            reason = str(error) if isinstance(error, (RuntimeError, ValueError)) else type(error).__name__
            return None, {'attemptedAt': stamp(), 'state': 'pending', 'reason': reason[:240]}

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        remaining = iter(selected)
        jobs = {}
        for asset in selected[:args.workers]:
            next(remaining)
            jobs[pool.submit(recover, asset)] = asset
        while jobs:
            done, _ = concurrent.futures.wait(jobs, return_when=concurrent.futures.FIRST_COMPLETED)
            for future in done:
                asset = jobs.pop(future)
                version, recovery = future.result()
                if version:
                    remember_version(asset, version)
                    report['recovered'] += 1
                else:
                    report['failed'] += 1
                asset['recovery'] = recovery
                save_recovery(directory, asset, version)
                report['attempted'] += 1
                if report['attempted'] % 25 == 0:
                    save_manifest(directory, manifest)
                print(json.dumps({'phase': 'download', 'asset': asset['id'], **report}), flush=True)
                if not stop_file.exists():
                    next_asset = next(remaining, None)
                    if next_asset:
                        if args.delay:
                            time.sleep(args.delay)
                        jobs[pool.submit(recover, next_asset)] = next_asset
    report['stoppedEarly'] = stop_file.exists()
    stop_file.unlink(missing_ok=True)
    save_manifest(directory, manifest)
    return report


def verify(directory, manifest):
    checked, errors = set(), []
    for asset in manifest['assets'].values():
        for version in asset['versions']:
            key = version['path']
            if key in checked:
                continue
            checked.add(key)
            file = directory / key
            if not within(directory, file):
                errors.append({'path': key, 'reason': 'unsafe path'})
            elif not file.is_file():
                errors.append({'path': key, 'reason': 'missing blob'})
            elif file.stat().st_size != version['bytes'] or sha256(file) != version['sha256']:
                errors.append({'path': key, 'reason': 'size or SHA-256 mismatch'})
        if asset['status'] == 'original' and not any(v['role'] in ('source-original', 'generated-original') for v in asset['versions']):
            errors.append({'asset': asset['id'], 'reason': 'original status has no original version'})
    return {'checkedBlobs': len(checked), 'errors': errors, 'summary': summarize(manifest)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive-dir', default=os.environ.get('ASSET_ARCHIVE_DIR', str(ROOT / 'storage/originals')))
    parser.add_argument('--inventory', action='store_true', help='Archive every current public asset and local generated original')
    parser.add_argument('--preserve', action='append', default=[], metavar='/images/FILE', help='Preserve only a named derivative; repeat for several URLs')
    parser.add_argument('--download', action='store_true', help='Recover verified full-resolution Commons originals')
    parser.add_argument('--verify', action='store_true', help='Check every referenced blob byte size and SHA-256')
    parser.add_argument('--limit', type=int, default=25, help='Maximum original attempts per run; 0 means all pending')
    parser.add_argument('--only', help='Comma-separated asset IDs or local filename stems')
    parser.add_argument('--refresh', action='store_true', help='Check for newer source revisions, retaining archived versions')
    parser.add_argument('--delay', type=float, default=0.3)
    parser.add_argument('--workers', type=int, choices=range(1, 4), default=3, help='Concurrent downloads, at most 3')
    parser.add_argument('--max-bytes', type=int, default=256 * 1024 * 1024)
    args = parser.parse_args()
    if args.limit < 0 or args.delay < 0 or args.max_bytes <= 0:
        parser.error('limit/delay must be nonnegative; max-bytes must be positive')
    if not any((args.inventory, args.download, args.verify, args.preserve)):
        args.inventory = True
    directory = Path(args.archive_dir).expanduser().resolve()
    if within(ROOT / 'public', directory) or directory == ROOT:
        parser.error('Archive must be separate from public assets and repository root')
    if args.preserve:
        print(json.dumps({'phase': 'preserve', **preserve_media_urls(args.preserve, archive_directory=directory)}), flush=True)
        if not any((args.inventory, args.download, args.verify)):
            return
    with archive_lock(directory):
        manifest = load_manifest(directory)
        if args.inventory:
            print(json.dumps({'phase': 'inventory', **inventory(directory, manifest)}), flush=True)
        if args.download:
            if not manifest['assets']:
                inventory(directory, manifest)
            print(json.dumps({'phase': 'download-complete', **download(directory, manifest, args)}), flush=True)
        if args.verify:
            report = verify(directory, manifest)
            print(json.dumps({'phase': 'verify', **report}), flush=True)
            if report['errors']:
                raise SystemExit(1)


if __name__ == '__main__':
    main()
