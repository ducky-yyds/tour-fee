"""Repair reviewed food, hotel, experience and place photos without broad search."""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT/'scripts/complete-media.py'), '--phase=exact',
                '--kinds=food,hotel,experience,place', '--photo-packs-only', '--thumb-width=400'], cwd=ROOT, check=True)
subprocess.run([sys.executable, str(ROOT/'scripts/complete-media.py'), '--phase=exact',
                '--reviewed-places-only', '--thumb-width=400'], cwd=ROOT, check=True)
for source in sorted((ROOT/'data/direct-photo-expansion').glob('*.json')):
    subprocess.run([sys.executable, str(ROOT/'scripts/import-direct-photos.py'), str(source),
                    '--missing-only'], cwd=ROOT, check=True)
