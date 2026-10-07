"""Download small research thumbnails and create indexed visual review sheets."""
import concurrent.futures, io, json, threading, time
from pathlib import Path
import requests
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/china-west-visual-review'; OUT.mkdir(parents=True,exist_ok=True)
HEADERS={'User-Agent':'TourFeeCatalogResearch/1.0 (https://github.com/ducky-yyds/tour-fee; visual review)'}
rows=[]
for folder in ['place-photo-expansion','experience-photo-expansion','food-photo-expansion','hotel-photo-expansion']:
    path=ROOT/'data'/folder/'china-west-20261007.json'
    if not path.exists():continue
    for eid,row in json.loads(path.read_text(encoding='utf-8')).items():
        cache=ROOT/'artifacts/china-west-photo-research'/(eid+'.json')
        candidates=json.loads(cache.read_text(encoding='utf-8')).get('candidates',[]) if cache.exists() else []
        candidate=next((c for c in candidates if c['photoFile']==row['photoFile']),None)
        if candidate:rows.append({'id':eid,**row,'thumbnailUrl':candidate.get('thumbnailUrl')})
lock=threading.Lock(); last=[0.0]
def get(row):
    target=OUT/(row['id']+'.jpg')
    if target.exists():return row
    if not row.get('thumbnailUrl'):row['error']='No thumbnail';return row
    for attempt in range(3):
        with lock:
            time.sleep(max(0,1-(time.monotonic()-last[0])));last[0]=time.monotonic()
        try:
            r=requests.get(row['thumbnailUrl'],headers=HEADERS,timeout=25)
            if r.status_code==429:time.sleep(max(30,float(r.headers.get('Retry-After','60'))));continue
            r.raise_for_status(); Image.open(io.BytesIO(r.content)).convert('RGB').save(target,quality=90);return row
        except Exception as exc:
            row['error']=str(exc)
    return row
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(get,rows))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
for page,start in enumerate(range(0,len(rows),24),1):
    sheet=Image.new('RGB',(1200,1410),'#eeeeee');draw=ImageDraw.Draw(sheet)
    for cell,row in enumerate(rows[start:start+24]):
        x=(cell%4)*300;y=(cell//4)*235;target=OUT/(row['id']+'.jpg')
        if target.exists():
            im=Image.open(target);im.thumbnail((292,195));sheet.paste(im,(x+(300-im.width)//2,y))
        else:draw.text((x+5,y+60),'DOWNLOAD MISSING',font=font,fill='red')
        text=f'{start+cell+1:03d} {row["id"]}'
        for n in range(0,len(text),37):draw.text((x+4,y+196+n//37*16),text[n:n+37],font=font,fill='black')
    sheet.save(OUT/f'sheet-{page:02d}.jpg',quality=93)
(OUT/'index.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'items':len(rows),'downloaded':sum((OUT/(r['id']+'.jpg')).exists() for r in rows),'sheets':(len(rows)+23)//24}))
