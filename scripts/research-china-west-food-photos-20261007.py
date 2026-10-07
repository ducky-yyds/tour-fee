"""Targeted dish-name Commons research; metadata only, no automatic approval."""
import json,re,time
from pathlib import Path
import requests
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/china-west-food-photo-research';OUT.mkdir(parents=True,exist_ok=True)
HEADERS={'User-Agent':'TourFeeCatalogResearch/1.0 (https://github.com/ducky-yyds/tour-fee; reusable destination image research)'}
QUERIES=['鲜花饼','竹筒饭','香茅草烤鱼','喃咪','舂鸡脚','甜醅','手抓羊肉','尕面片','酸奶 青海','藏式 酸奶','灰豆子','牛奶鸡蛋醪糟','三炮台','酿皮','张掖 搓鱼子','张掖 炒拨拉','张掖 臊子面','卷子鸡','张掖 牛肉小饭','石锅鸡','藏香猪','荞麦饼 西藏','松茸汤','稀豆粉','饵丝','松花糕','抓饭 新疆','烤包子','新疆 羊肉串','伊犁 冰淇淋','面肺子','粉汤 伊犁','大列巴 伊犁']
for term in QUERIES:
 p=OUT/(term+'.json')
 if p.exists():continue
 for attempt in range(3):
  time.sleep(4)
  try:
   r=requests.get('https://commons.wikimedia.org/w/api.php',params={'format':'json','action':'query','generator':'search','gsrnamespace':6,'gsrlimit':5,'gsrsearch':term+' filetype:bitmap','prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':400},headers=HEADERS,timeout=30)
   if r.status_code==429:time.sleep(max(30,float(r.headers.get('Retry-After','60'))));continue
   r.raise_for_status();data=r.json();break
  except Exception:
   data={}
 rows=[]
 for page in data.get('query',{}).get('pages',{}).values():
  if not page.get('imageinfo'):continue
  info=page['imageinfo'][0];meta=info.get('extmetadata',{});val=lambda k:re.sub('<[^>]*>','',meta.get(k,{}).get('value',''))
  rows.append({'photoFile':page['title'][5:],'sourceUrl':info.get('descriptionurl'),'url':info.get('url'),'thumbnailUrl':info.get('thumburl'),'license':val('LicenseShortName'),'licenseUrl':val('LicenseUrl'),'author':val('Artist'),'description':val('ImageDescription'),'checkedAt':'2026-10-07','searchTerm':term})
 p.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({'term':term,'count':len(rows)},ensure_ascii=False),flush=True)
