"""Render the explicitly selected food/property candidate manifest for inspection."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'scripts/review-china-west-photos-20261007.py').read_text(encoding='utf8')
start=source.index('rows=[]');end=source.index('lock=threading.Lock()')
source=source[:start]+"rows=json.loads((OUT/'candidates.json').read_text(encoding='utf8'))\n"+source[end:]
source=source.replace("OUT=ROOT/'artifacts/china-west-visual-review'", "OUT=ROOT/'artifacts/china-west-food-visual-review'")
exec(compile(source,__file__,'exec'))
