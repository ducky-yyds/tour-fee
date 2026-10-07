"""Target actual cultural/nature subjects with explicit review required."""
import importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('east_photo_research',ROOT/'scripts/research-china-east-photos-20261007.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
mod.BASE=ROOT/'artifacts/china-east-assist-20261007'
dest=mod.BASE/'photo-candidates.json';rows=mod.read(dest,{})
queries={
 'yangzhou-daming':'"Daming" "Yangzhou"',
 'yangzhou-zhushi':'"朱自清故居" "扬州"',
 'jingdezhen-gaoling':'"Fuliang Gaoling"',
 'ex-jingdezhen-wheel':'"Jingdezhen" "potter"',
 'ex-jingdezhen-painting':'"Jingdezhen" "painting"',
 'ex-jingdezhen-tea-landscape':'"Fuliang" "tea"',
 'ex-jingdezhen-night-market':'"Taoxichuan" "market"',
 'ex-yangzhou-storytelling':'"扬州评话"',
 'ex-yangzhou-woodblock':'"Yangzhou" "printing"',
 'ex-yangzhou-canal-boat':'"Yangzhou" "boat"',
 'ex-yangzhou-paper-cut':'"扬州剪纸"',
 'ex-shaoxing-wupeng':'"Shaoxing" "boat"',
 'ex-shaoxing-huangjiu-tasting':'"Shaoxing wine"',
 'ex-shaoxing-opera':'"Yue opera"',
 'ex-shaoxing-calligraphy':'"Chinese calligraphy"',
 'ex-chaozhou-gongfu':'"Gongfu tea"',
 'ex-chaozhou-woodcarving':'"Chaozhou" "woodcarving"',
 'ex-chaozhou-opera':'"Teochew opera"',
 'ex-chaozhou-phoenix-tea':'"Fenghuang" "tea"',
 'ex-macau-dragonboat':'"Macau" "dragon boat"',
 'ex-macau-fado':'"Fado" "performance"',
}
for id,phrase in queries.items():
 rec=rows.setdefault(id,{'id':id,'candidates':[]});q=phrase+' filetype:bitmap'
 try:
  r=mod.api('https://commons.wikimedia.org/w/api.php',{'generator':'search','gsrsearch':q,'gsrnamespace':6,'gsrlimit':5,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':400})
  for p in sorted(r.get('query',{}).get('pages',{}).values(),key=lambda x:x.get('index',99)):
   if mod.eligible(p):
    c=mod.candidate(p,'commons-experience-theme',q)
    if c['photoFile'] not in [a['photoFile'] for a in rec['candidates']]:rec['candidates'].append(c)
  print(id,len(rec['candidates']),flush=True)
 except Exception as e:print(id,str(e),flush=True)
 mod.write(dest,rows)
