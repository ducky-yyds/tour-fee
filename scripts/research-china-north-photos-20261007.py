"""Find licensed photographic candidates, retaining query and match evidence.

This script never updates media.json or downloads published card assets. Candidates
need subject review; a successful search is not a claim of visual verification.
"""
import concurrent.futures, hashlib, html, json, re, runpy, threading, time
from pathlib import Path
import requests
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/china-north-20261007-photo-research.json'
CACHE=ROOT/'artifacts/china-north-photo-cache'
UA='TusuanTravelMedia/2.0 (+https://github.com/ducky-yyds/tour-fee; licensed cached media)'
lock=threading.Lock(); next_time=0
def plain(t): return re.sub(r'<[^>]*>', '', html.unescape(t or ''))
def search(q):
    global next_time
    key=hashlib.sha256(q.encode()).hexdigest(); path=CACHE/(key+'.json')
    if path.exists(): return json.loads(path.read_text('utf-8'))
    with lock:
        pause=max(0,next_time-time.monotonic()); next_time=time.monotonic()+pause+4.0
    if pause:time.sleep(pause)
    resp=requests.get('https://commons.wikimedia.org/w/api.php',headers={'User-Agent':UA},params={
        'action':'query','format':'json','generator':'search','gsrsearch':q+' filetype:bitmap',
        'gsrnamespace':6,'gsrlimit':4,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':400},timeout=45)
    if resp.status_code==429:
        retry=resp.headers.get('Retry-After','')
        pause=max(60,int(retry)) if retry.isdigit() else 60
        with lock:next_time=max(next_time,time.monotonic()+pause)
        # Leave a resumable error; never change the endpoint to bypass refusal.
        raise RuntimeError('Commons rate limit; stop this round and wait at least '+str(pause)+' seconds')
    resp.raise_for_status(); data=resp.json(); rows=[]
    for p in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',99)):
        f=p['title'].removeprefix('File:'); infos=p.get('imageinfo',[])
        if not infos or not re.search(r'\.(?:jpg|jpeg|png|webp)$',f,re.I):continue
        info=infos[0]; m=info.get('extmetadata',{}); lic=plain(m.get('LicenseShortName',{}).get('value',''))
        desc=plain(m.get('ImageDescription',{}).get('value',''))
        if not re.match(r'CC BY(?:-SA)? |CC0|Public domain|FAL|Free Art License',lic):continue
        if re.search(r'\b(map|logo|flag|coat of arms|portrait|diagram|drawing)\b',f+' '+desc[:300],re.I):continue
        if min(info.get('width',0),info.get('height',0))<240:continue
        rows.append({'photoFile':f,'sourceUrl':info['descriptionurl'],'license':lic,
                     'licenseUrl':plain(m.get('LicenseUrl',{}).get('value','')),
                     'artist':plain(m.get('Artist',{}).get('value','')),'description':desc,
                     'originalUrl':info['url'],'thumbnailUrl':info.get('thumburl',info['url']),
                     'sourceCheckedAt':'2026-10-07','query':q,'visualReview':'pending'})
    CACHE.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(rows,ensure_ascii=False,indent=2),'utf-8')
    return rows
def work(e):
    q=e.get('photoQuery',e.get('nameEn',e['name']))
    try:
        candidates=search(q)
        if not candidates and e['name']!=q: candidates=search(e['name'])
        return e['id'],{'name':e['name'],'kind':e.get('kind','city' if 'attractions' in e else 'place'),'query':q,'candidates':candidates}
    except Exception as ex:return e['id'],{'name':e['name'],'query':q,'candidates':[],'error':str(ex)}
if __name__=='__main__':
    pack=runpy.run_path(str(ROOT/'scripts/seed-china-north-20261007.py'))
    entities=pack['CITIES']+sum([c['attractions'] for c in pack['CITIES']],[])+pack['EXPERIENCES']+pack['FOODS']
    previous=json.loads(OUT.read_text('utf-8')) if OUT.exists() else {}
    todo=[e for e in entities if e['id'] not in previous or 'error' in previous[e['id']]]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for n,(id,row) in enumerate(pool.map(work,todo),1):
            previous[id]=row
            if n%10==0:OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(previous,ensure_ascii=False,indent=2),'utf-8');print(n,len(todo),id,flush=True)
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(previous,ensure_ascii=False,indent=2),'utf-8')
    print(json.dumps({'entities':len(previous),'withCandidates':sum(bool(r['candidates']) for r in previous.values())}))
