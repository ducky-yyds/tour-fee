"""Collect licensed photograph candidates; never publish an unreviewed match.

Reads owned source packs only. Caches API metadata and thumbnails under artifacts.
The result deliberately keeps visualReviewRequired true until human/agent review.
"""
import argparse, hashlib, html, json, re, sys, time
from pathlib import Path
from urllib.parse import quote, unquote
import requests

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'artifacts/china-east-20261007'
BASE.mkdir(parents=True,exist_ok=True)
if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8')
SESSION=requests.Session()
SESSION.headers['User-Agent']='TusuanTravelMedia/2.0 (+https://github.com/ducky-yyds/tour-fee; licensed cached media)'
def read(p,default=None):return json.loads(p.read_text(encoding='utf-8-sig')) if p.exists() else default
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def api(endpoint,params):
    key=hashlib.sha256((endpoint+json.dumps(params,sort_keys=True,ensure_ascii=False)).encode()).hexdigest()
    cache=BASE/'api'/f'{key}.json'
    if cache.exists():return read(cache)
    time.sleep(4)
    res=SESSION.get(endpoint,params={'action':'query','format':'json',**params},timeout=35)
    if res.status_code==429:
        pause=max(60,int(res.headers.get('Retry-After','60'))) if res.headers.get('Retry-After','60').isdigit() else 60
        print('rate limited; backing off',pause,flush=True)
        time.sleep(pause)
        raise SystemExit('Remote rate limit; stopped instead of continuing batch')
    res.raise_for_status();v=res.json()
    if 'error' in v:raise ValueError(v['error'])
    write(cache,v);return v
def clean(s):return html.unescape(re.sub('<[^>]+>',' ',s or '')).strip()
def eligible(page):
    if not re.search(r'\.(?:jpe?g|png|webp)$',page.get('title',''),re.I):return False
    info=(page.get('imageinfo') or [{}])[0];meta=info.get('extmetadata',{})
    license=clean(meta.get('LicenseShortName',{}).get('value',''))
    if not re.fullmatch(r'CC BY(?:-SA)? (?:1\.0|2\.[015]|3\.0|4\.0)(?: [a-z]{2}(?:-[a-z]+)?)?|CC0|Public domain|FAL',license,re.I):return False
    if min(info.get('width',0),info.get('height',0))<240:return False
    if re.search(r'(?:^|[\s_.-])(flag|map|logo|locator|emblem|coat.of.arms|portrait|icon)(?:[\s_.-]|$)',page['title'],re.I):return False
    return True
def candidate(page,method,query):
    info=page['imageinfo'][0];meta=info.get('extmetadata',{})
    return {'photoFile':page['title'].removeprefix('File:'),'sourceUrl':info.get('descriptionurl'),'remoteUrl':info.get('thumburl') or info.get('url'),'originalUrl':info.get('url'),
      'license':clean(meta.get('LicenseShortName',{}).get('value')),'licenseUrl':meta.get('LicenseUrl',{}).get('value'),'artist':clean(meta.get('Artist',{}).get('value')),
      'description':clean(meta.get('ImageDescription',{}).get('value')),'width':info.get('width'),'height':info.get('height'),'method':method,'query':query,'checkedAt':'2026-10-07','visualReviewRequired':True}
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--kind',choices=['all','food','hotel','place','experience','city'],default='all');parser.add_argument('--commons',action='store_true');parser.add_argument('--skip-wiki',action='store_true');parser.add_argument('--city-ids',default='');parser.add_argument('--query-limit',type=int,default=3);args=parser.parse_args()
    cities=read(ROOT/'data/expansion/china-east-20261007.json');entries=read(ROOT/'data/experience-expansion/china-east-20261007.json');foods=read(ROOT/'data/food-expansion/china-east-20261007.json')
    items=[{**c,'_kind':'city','_city':c['name']} for c in cities]+[{**p,'_kind':'place','_city':c['name']} for c in cities for p in c['attractions']]+[{**e,'_kind':e['kind'],'_city':next(c['name'] for c in cities if c['id']==e['cityId'])} for e in entries]+[{**f,'_kind':'food','_city':next(c['name'] for c in cities if c['id']==f['cityIds'][0])} for f in foods]
    if args.kind!='all':items=[r for r in items if r['_kind']==args.kind]
    if args.city_ids:
      selected=set(args.city_ids.split(','));names={c['name'] for c in cities if c['id'] in selected}
      items=[r for r in items if r['_city'] in names]
    results=read(BASE/'photo-candidates.json',{})
    # Encyclopedia primary images provide an explicit subject association.
    for lang in ([] if args.skip_wiki else ['zh','en']):
      lookups={}
      for item in items:
        names=[item['name']] if lang=='zh' else [item.get('article'),item.get('nameEn')]
        for n in names:
          if n:lookups.setdefault(n,[]).append(item['id'])
      names=list(lookups)
      for start in range(0,len(names),45):
        batch=names[start:start+45]
        try:resp=api(f'https://{lang}.wikipedia.org/w/api.php',{'titles':'|'.join(batch),'redirects':1,'converttitles':1,'prop':'pageimages|info','piprop':'name','inprop':'url'})
        except Exception as exc:print('wiki failure',lang,start,str(exc),flush=True);continue
        renames={x['from']:x['to'] for key in ['normalized','converted','redirects'] for x in resp.get('query',{}).get(key,[])}
        def final(n):
          seen=set()
          while n in renames and n not in seen:seen.add(n);n=renames[n]
          return n
        pages={p['title']:p for p in resp.get('query',{}).get('pages',{}).values()}
        infos={}
        file_names=['File:'+p['pageimage'] for p in pages.values() if p.get('pageimage')]
        if file_names:
          try:
            files=api('https://commons.wikimedia.org/w/api.php',{'titles':'|'.join(file_names),'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':400})
            infos={p['title'].replace('_',' '):p for p in files.get('query',{}).get('pages',{}).values() if eligible(p)}
          except Exception as exc:print('commons info failure',str(exc),flush=True)
        for n in batch:
          page=pages.get(final(n),{});file=infos.get(('File:'+page.get('pageimage','')).replace('_',' '))
          for item_id in lookups[n]:
            record=results.setdefault(item_id,{'id':item_id,'candidates':[]})
            if page.get('pageid',0)>0:record.setdefault('subjectPages',{})[lang]=page.get('fullurl')
            if file:
              row=candidate(file,'wikipedia-primary',page.get('fullurl'))
              if row['photoFile'] not in [a['photoFile'] for a in record['candidates']]:record['candidates'].append(row)
        write(BASE/'photo-candidates.json',results)
    if args.commons:
      for i,item in enumerate(items):
        rec=results.setdefault(item['id'],{'id':item['id'],'candidates':[]})
        if rec['candidates']:continue
        queries=([item.get('article'),item['name'],item.get('nameEn')] if item['_kind']=='experience' else [item['name'],item.get('article'),item.get('nameEn')])
        for phrase in list(dict.fromkeys(queries))[:args.query_limit]:
          if not phrase:continue
          query='"'+phrase+'" filetype:bitmap'
          try:
            res=api('https://commons.wikimedia.org/w/api.php',{'generator':'search','gsrsearch':query,'gsrnamespace':6,'gsrlimit':4,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':400})
            ps=sorted(res.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',99))
            rec['candidates']+=[candidate(p,'commons-search',query) for p in ps if eligible(p) and p['title'].removeprefix('File:') not in [x['photoFile'] for x in rec['candidates']]]
          except Exception as exc:rec.setdefault('errors',[]).append(str(exc));print('search failure',item['id'],str(exc),flush=True)
          if rec['candidates']:break
        if i%10==0:print('progress',i,len(items),'with candidates',sum(bool(results.get(r['id'],{}).get('candidates')) for r in items),flush=True)
        write(BASE/'photo-candidates.json',results)
    for item in items:
      results.setdefault(item['id'],{'id':item['id'],'candidates':[]}).update({'name':item['name'],'kind':item['_kind'],'city':item['_city']})
    write(BASE/'photo-candidates.json',results)
    print(json.dumps({'items':len(items),'withCandidates':sum(bool(results.get(r['id'],{}).get('candidates')) for r in items),'unmatched':[r['id'] for r in items if not results.get(r['id'],{}).get('candidates')]},ensure_ascii=False))
if __name__=='__main__':main()
