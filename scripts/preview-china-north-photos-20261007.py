"""Prepare contact sheets for visual review, without publishing any image."""
import concurrent.futures, hashlib, io, json, threading, time
from pathlib import Path
import requests
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/'artifacts/china-north-photo-preview';DIR.mkdir(parents=True,exist_ok=True)
rows=json.loads((ROOT/'artifacts/china-north-20261007-photo-selections.json').read_text('utf-8'))
UA='TusuanTravelMedia/2.0 (+https://github.com/ducky-yyds/tour-fee; image subject review)'
lock=threading.Lock();next_at=0
def fetch(row):
    global next_at
    id,v=row;p=DIR/(hashlib.sha256(v['photoFile'].encode()).hexdigest()[:18]+'.jpg')
    if p.exists():return id,str(p)
    try:
        with lock:
            delay=max(0,next_at-time.monotonic());next_at=time.monotonic()+delay+1
        if delay:time.sleep(delay)
        r=requests.get(v['thumbnailUrl'],headers={'User-Agent':UA},timeout=30)
        r.raise_for_status();im=Image.open(io.BytesIO(r.content)).convert('RGB');im.save(p,quality=92)
        return id,str(p)
    except Exception as ex:return id,{'error':str(ex)}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: paths=dict(pool.map(fetch,rows.items()))
(DIR/'index.json').write_text(json.dumps(paths,ensure_ascii=False,indent=2),'utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
for start in range(0,len(rows),36):
    sheet=Image.new('RGB',(1440,1080),'white');draw=ImageDraw.Draw(sheet)
    for i,(id,v) in enumerate(list(rows.items())[start:start+36]):
        x=(i%6)*240;y=(i//6)*180
        path=paths[id]
        if isinstance(path,str):
            im=Image.open(path);im.thumbnail((236,145));sheet.paste(im,(x+(236-im.width)//2,y))
        else:draw.text((x+5,y+50),'DOWNLOAD FAILED',fill='red',font=font)
        draw.text((x+4,y+147),str(start+i)+': '+id[:30],fill='black',font=font)
    sheet.save(DIR/('sheet-'+str(start//36+1)+'.jpg'),quality=92)
print(json.dumps({'rows':len(rows),'downloaded':sum(isinstance(p,str) for p in paths.values()),'sheets':(len(rows)+35)//36}))
