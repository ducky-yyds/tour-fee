"""Download manually shortlisted place candidates for visual auditing only."""
import hashlib, json, pathlib, sys, time, requests
from PIL import Image, ImageOps, ImageDraw
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=ROOT/'artifacts/china-east-20261007'
SELECT={
 'huangshan-mountain':0,'huangshan-tunxi':3,'huangshan-museum':0,'huangshan-cheng-houses':0,
 'huangshan-daizhen':0,'huangshan-chengkan':1,'huangshan-tangmo':0,'huangshan-qiankou':0,
 'huangshan-huizhou-oldtown':0,'huangshan-hongcun':0,'huangshan-xidi':0,'huangshan-tachuan':2,
 'huangshan-qiyun':0,'huangshan-huashan':0,
 'hefei-bao-park':0,'hefei-li-hongzhang':0,'hefei-xiaoyaojin':2,'hefei-mingjiao':2,
 'hefei-huaihe':0,'hefei-art-museum':0,'hefei-swan-lake':0,'hefei-luogang':1,
 'hefei-crossing-memorial':0,'hefei-anhui-notables':0,
 'fuzhou-lanes':0,'fuzhou-linzexu':0,'fuzhou-westlake':2,'fuzhou-fujian-museum':0,
 'fuzhou-hualin':3,'fuzhou-yushan':2,'fuzhou-shangxiahang':3,'fuzhou-yantaishan':0,
 'fuzhou-fanchuanpu':0,'fuzhou-shipyard':1,
 'wuyishan-tianyou':0,'wuyishan-yixiantian':2,'wuyishan-huxiaoyan':0,'wuyishan-shuiliandong':2,
 'wuyishan-wuyi-palace':0,'wuyishan-zhuxi-garden':0,'wuyishan-xiamei':0,'wuyishan-han-city':3,
 'wuyishan-yulin':0,'wuyishan-baiyun-temple':0,
 'leshan-giant-buddha':0,'leshan-oriental-buddha':3,'leshan-mahao':0,'leshan-confucian':0,
 'leshan-wuyou':0,'leshan-jiading-wall':1,'leshan-qianfo':0,'leshan-qianwei-confucian':0,
 'leshan-emei':0,'leshan-baoguo':0,
 'guiyang-qianling':1,'guiyang-jiaxiu':0,'guiyang-province-museum':1,'guiyang-geological':0,
 'guiyang-yangming':3,
 'hefei-binhu-forest':0,'hefei-sanhe':1,'fuzhou-guling':0,'fuzhou-jinniushan':0,
 'fuzhou-tanshishan':1,'guiyang-qingyan':0,'guiyang-tianhetan':2,
}
SELECT_EXPERIENCES={
 'ex-huangshan-huizhou-ink':1,'ex-huangshan-maofeng-tea':0,'ex-huangshan-sunrise':0,
 'ex-hefei-opera':1,'ex-hefei-chaohu-cycling':3,
 'ex-fuzhou-jasmine':3,'ex-fuzhou-min-opera':0,'ex-fuzhou-lacquer':0,
 'ex-wuyishan-bamboo-raft':1,'ex-wuyishan-rock-tea':0,
 'ex-leshan-buddha-boat':1,'ex-leshan-jiayang-steam':0,
}
def main():
 if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8')
 data=json.loads((BASE/'photo-candidates.json').read_text(encoding='utf-8'));rows=[]
 session=requests.Session();session.headers['User-Agent']='TusuanTravelPhotoReview/1.0 (+https://github.com/ducky-yyds/tour-fee)'
 out=BASE/'review';out.mkdir(exist_ok=True)
 group='experiences' if '--experiences' in sys.argv else 'places';selected=SELECT_EXPERIENCES if group=='experiences' else SELECT
 previous={r['id']:r for r in json.loads((out/f'{group}-shortlist.json').read_text(encoding='utf-8'))} if (out/f'{group}-shortlist.json').exists() else {}
 for key,index in selected.items():
  ps=data.get(key,{}).get('candidates',[])
  if len(ps)<=index:continue
  photo=ps[index];dest=out/(key+'-'+hashlib.sha256(photo['photoFile'].encode()).hexdigest()[:8]+'.jpg')
  old=previous.get(key)
  if old and old['photo']['photoFile']==photo['photoFile'] and pathlib.Path(old['local']).exists():dest=pathlib.Path(old['local'])
  if not dest.exists():
   time.sleep(1);response=session.get(photo['remoteUrl'],timeout=35)
   if response.status_code==429:raise SystemExit('CDN limited; review download stopped')
   if response.status_code!=200:print('skip',key,response.status_code,flush=True);continue
   dest.write_bytes(response.content)
  rows.append({'id':key,'photo':photo,'local':str(dest)})
 (out/f'{group}-shortlist.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 for start in range(0,len(rows),12):
  chunk=rows[start:start+12];sheet=Image.new('RGB',(1200,275*((len(chunk)+3)//4)),'white');draw=ImageDraw.Draw(sheet)
  for i,row in enumerate(chunk):
   x=i%4*300;y=i//4*275
   with Image.open(row['local']) as im:sheet.paste(ImageOps.contain(im.convert('RGB'),(290,225)),(x,y))
   draw.text((x+3,y+232),str(start+i+1)+' '+row['id'],fill='black')
  sheet.save(out/f'{group}-contact-{start//12+1}.jpg')
 print('Review candidates',len(rows),flush=True)
if __name__=='__main__':main()
