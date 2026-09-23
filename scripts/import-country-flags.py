"""Vendor the small 4:3 SVG flags used by destination and currency selectors."""
import io
import json
from pathlib import Path
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
VERSION = '7.3.2'
url = f'https://registry.npmjs.org/flag-icons/-/flag-icons-{VERSION}.tgz'
target = ROOT / 'public' / 'flags'
target.mkdir(parents=True, exist_ok=True)
with urllib.request.urlopen(url, timeout=60) as response:
    archive = response.read()
codes = []
with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as package:
    for entry in package.getmembers():
        path = Path(entry.name)
        if entry.isfile() and entry.name.startswith('package/flags/4x3/') and path.suffix == '.svg' and len(path.stem) == 2:
            (target / path.name).write_bytes(package.extractfile(entry).read())
            codes.append(path.stem.upper())
        elif entry.name == 'package/LICENSE':
            (target / 'LICENSE').write_bytes(package.extractfile(entry).read())
(ROOT / 'src' / 'flag-codes.json').write_text(json.dumps(sorted(codes)), encoding='utf-8')
(target / 'README.md').write_text(f'# Country flags\n\nVendored from [flag-icons {VERSION}](https://github.com/lipis/flag-icons), MIT license (see LICENSE). Only the two-letter 4:3 flags are included.\n\nRefresh with `py -3 scripts/import-country-flags.py`.\n', encoding='utf-8')
print(f'Imported {len(codes)} local SVG flags from flag-icons {VERSION}.')
