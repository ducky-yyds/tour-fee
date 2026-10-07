"""Independent five-city photo research shard; does not write the east cache."""
import importlib.util,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('east_photo_research',ROOT/'scripts/research-china-east-photos-20261007.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
mod.BASE=ROOT/'artifacts/china-east-assist-20261007'
mod.BASE.mkdir(parents=True,exist_ok=True)
dest=mod.BASE/'photo-candidates.json'
city_ids=('jingdezhen','yangzhou','shaoxing','chaozhou','macau')
if not dest.exists():
    source=mod.read(ROOT/'artifacts/china-east-20261007/photo-candidates.json',{})
    source={k:v for k,v in source.items() if any(k.startswith(c+'-') or k.startswith('ex-'+c+'-') for c in city_ids)}
    mod.write(dest,source)
sys.argv += ['--city-ids',','.join(city_ids)]
mod.main()
