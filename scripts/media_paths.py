"""Shared derivative-image location; public URLs remain /images/... after deployment."""
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


def media_root():
    configured = Path(os.environ.get('MEDIA_ROOT', str(ROOT / 'public/images'))).expanduser()
    return (ROOT / configured).resolve() if not configured.is_absolute() else configured.resolve()


def media_path(url):
    if not isinstance(url, str) or not url.startswith('/images/'):
        return None
    relative = unquote(urlsplit(url).path).removeprefix('/images/')
    if not relative or '\\' in relative or ':' in relative or '..' in relative.split('/'):
        return None
    base = media_root()
    candidate = (base / relative).resolve()
    try:
        candidate.relative_to(base)
    except ValueError:
        return None
    return candidate
