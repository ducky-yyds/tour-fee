"""Create local contact sheets for the isolated five-city photo review shard."""
import hashlib,json,sys,time
from pathlib import Path
import requests
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'artifacts/china-east-assist-20261007'
REVIEW=BASE/'review'; REVIEW.mkdir(exist_ok=True)
if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8')
d=json.loads((BASE/'photo-candidates.json').read_text('utf-8'))
S=requests.Session();S.headers['User-Agent']='TusuanTravelMedia/2.0 (+https://github.com/ducky-yyds/tour-fee; licensed cached media)'
choices={k:0 for k,v in d.items() if v.get('candidates') and k!='macau-st-pauls'}
choices.update({'jingdezhen-ancient-kiln':3,'shaoxing-luxun':1,'macau-museum':1,'macau-taipa-houses':1,'macau-hacsa':1,'macau-seacpai':1,'macau-loulim':1})
choices.update({'jingdezhen-fudao':2,'jingdezhen-red-tower':1,'shaoxing-east-lake':7,'yangzhou-wenchang':1,'shaoxing-xuwei':4,'shaoxing-datong':1,'macau-dominic':7,'macau-guia':1,'macau-maritime':3,'macau-fortress':1})
choices.update({'jingdezhen-red-tower':2,'jingdezhen-gaoling':4,'yangzhou-daming':5,'macau-grand-prix':1,
 'ex-yangzhou-storytelling':0,'ex-yangzhou-woodblock':2,'ex-shaoxing-wupeng':0,'ex-shaoxing-huangjiu-tasting':3,
 'ex-shaoxing-opera':0,'ex-chaozhou-gongfu':1,'ex-chaozhou-woodcarving':3,'ex-chaozhou-opera':1,'ex-macau-dragonboat':1,'ex-macau-fado':2})
for id in ['jingdezhen-sanbao','jingdezhen-hutian','yangzhou-zhushi','shaoxing-fushan','shaoxing-tashan','chaozhou-fenghuang-tea',
           'ex-jingdezhen-wheel','ex-jingdezhen-painting','ex-yangzhou-canal-boat','ex-shaoxing-calligraphy','ex-chaozhou-phoenix-tea']:
    choices.pop(id,None)
index=[]
for id,ix in choices.items():
    if ix>=len(d.get(id,{}).get('candidates',[])):continue
    src=d[id]['candidates'][ix]; url=src['remoteUrl']; out=REVIEW/(hashlib.sha256(url.encode()).hexdigest()[:20]+'.jpg')
    if not out.exists():
        time.sleep(4)
        try:
            r=S.get(url,timeout=35)
            if r.status_code==429:
                print('429: stopped without switching host or query',flush=True)
                raise SystemExit(2)
            r.raise_for_status();out.write_bytes(r.content)
        except requests.RequestException as e:print('thumbnail failed',id,str(e),flush=True);continue
    try:Image.open(out).verify()
    except Exception:continue
    index.append({'id':id,'candidateIndex':ix,'photoFile':src['photoFile'],'path':str(out.relative_to(ROOT))})
    if len(index)%15==0:print('downloaded',len(index),flush=True)
(REVIEW/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n','utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
for start in range(0,len(index),30):
    sheet=Image.new('RGB',(1500,1100),'#f2eee7');draw=ImageDraw.Draw(sheet)
    for n,row in enumerate(index[start:start+30]):
        x=(n%5)*300;y=(n//5)*183
        im=Image.open(ROOT/row['path']).convert('RGB');im.thumbnail((294,150))
        sheet.paste(im,(x+(294-im.width)//2,y))
        draw.text((x+3,y+152),row['id'][:38],font=font,fill='black')
        draw.text((x+3,y+167),'candidate '+str(row['candidateIndex']),font=font,fill='black')
    sheet.save(REVIEW/f'contact-{start//30+1}.jpg',quality=92)
print('review candidates',len(index))
