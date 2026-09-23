"""Retrieve Commons metadata for dish files discovered in multilingual articles."""
import json,urllib.request,urllib.parse,html,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FILES={'food-jidou-liangfen':['丽江鸡豌豆凉粉 - Chicken pea jelly.jpg'],'food-china2-harbin-guobaorou':['Guōbāoròu.jpg'],'food-asia-busan-eomuk':['Eomuk.jpg','Street eomuk.jpg'],'food-china2-chongqing-chen-mahua':['Mafaimage2.jpg'],'food-fish-dumplings':['山东鲅鱼饺子.jpg']}
FILES.update({'food-asia-jeju-black-pork':['Korean BBQ.jpg'],'food-red-bean-rice-balls':['赤豆酒酿元宵.jpg']})
url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':'|'.join('File:'+f for fs in FILES.values() for f in fs),'prop':'imageinfo','iiprop':'url|extmetadata|size'})
req=urllib.request.Request(url,headers={'User-Agent':'TusuanTravelPhotoDiscovery/1.0 (https://github.com/ducky-yyds/tour-fee)'})
with urllib.request.urlopen(req,timeout=30) as response:data=json.load(response)
plain=lambda s:re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s or ''))).strip()
path=ROOT/'artifacts/asia-food-photo-search.json'
out=json.loads(path.read_text('utf-8'))
for page in data.get('query',{}).get('pages',{}).values():
 if 'missing' in page:continue
 name=page['title'].removeprefix('File:');image=(page.get('imageinfo') or [{}])[0];meta=image.get('extmetadata',{})
 row={'photoFile':name,'sourceUrl':image.get('descriptionurl'),'license':plain(meta.get('LicenseShortName',{}).get('value')),'licenseUrl':plain(meta.get('LicenseUrl',{}).get('value')),'artist':plain(meta.get('Artist',{}).get('value')),'description':plain(meta.get('ImageDescription',{}).get('value')),'categories':plain(meta.get('Categories',{}).get('value')),'originalUrl':image.get('url'),'width':image.get('width'),'height':image.get('height')}
 for food,names in FILES.items():
  if name in names:
   out[food]['candidates'].append(row)
 print(json.dumps(row,ensure_ascii=False))
path.write_text(json.dumps(out,ensure_ascii=False,indent=2),'utf-8')
