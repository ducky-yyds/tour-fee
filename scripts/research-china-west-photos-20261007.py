"""Fetch actual Commons filenames and license evidence, never canonical media.

English Wikipedia exact article lead images are candidates only. Search results,
especially hotel images and illustrations, are not automatically approved.
"""
import concurrent.futures, json, re, time
from pathlib import Path
from urllib.parse import quote
import requests

ROOT=Path(__file__).resolve().parents[1]
DAY='2026-10-07'
HEADERS={'User-Agent':'TourFeeCatalogResearch/1.0 (https://github.com/ducky-yyds/tour-fee; reusable destination image research)'}
path=ROOT/'data/photo-research/china-west-20261007.json'
doc=json.loads(path.read_text(encoding='utf-8'))
cache=ROOT/'artifacts/china-west-photo-research'; cache.mkdir(parents=True,exist_ok=True)

def api(host,params):
    for attempt in range(3):
        try:
            if host=='commons.wikimedia.org':time.sleep(4)
            r=requests.get(f'https://{host}/w/api.php',params={'format':'json',**params},headers=HEADERS,timeout=25)
            if r.status_code==429:
                time.sleep(max(30,float(r.headers.get('Retry-After','60')))); continue
            r.raise_for_status(); return r.json()
        except Exception:
            if attempt==2:return {}
            time.sleep(1+attempt)

def metadata(filename):
    data=api('commons.wikimedia.org',{'action':'query','prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':400,'titles':'File:'+filename})
    for page in data.get('query',{}).get('pages',{}).values():
        if not page.get('imageinfo'):continue
        info=page['imageinfo'][0]; ex=info.get('extmetadata',{})
        val=lambda k:re.sub('<[^>]*>','',ex.get(k,{}).get('value',''))
        return {'photoFile':page['title'][5:],'sourceUrl':info.get('descriptionurl'),'url':info.get('url'),'thumbnailUrl':info.get('thumburl'),'license':val('LicenseShortName'),'licenseUrl':val('LicenseUrl'),'author':val('Artist'),'description':val('ImageDescription'),'mime':info.get('mime'),'checkedAt':DAY}
    return None

def run(row):
    dest=cache/(row['entityId'].replace(':','_')+'.json')
    if dest.exists():return json.loads(dest.read_text(encoding='utf-8'))
    result=dict(row)
    article=row['article']
    data=api('en.wikipedia.org',{'action':'query','prop':'pageimages|pageprops','piprop':'name|original','titles':article,'redirects':1})
    candidates=[]
    for page in data.get('query',{}).get('pages',{}).values():
        if page.get('pageimage'):
            m=metadata(page['pageimage'])
            if m:m.update(matchMethod='exact-article-lead',articleTitle=page['title']); candidates.append(m)
    if not candidates:
        terms=[row['query']]
        if row['kind']!='experience':terms.append(row['name'].split('与')[0])
        for term in terms:
            found=api('commons.wikimedia.org',{'action':'query','list':'search','srnamespace':6,'srlimit':3,'srsearch':term+' filetype:bitmap'})
            for hit in found.get('query',{}).get('search',[]):
                m=metadata(hit['title'][5:])
                if m:m.update(matchMethod='commons-search',searchTerm=term);candidates.append(m)
            if candidates:break
    result['candidates']=candidates
    result['status']='metadata-fetched-awaiting-subject-review' if candidates else 'no-reusable-match-found'
    dest.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    return result

rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    for i,r in enumerate(pool.map(run,doc['entries']),1):
        rows.append(r)
        if i%30==0:print(json.dumps({'processed':i,'withCandidates':sum(bool(x.get('candidates')) for x in rows)}),flush=True)
doc['entries']=rows
path.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'rows':len(rows),'withCandidates':sum(bool(x.get('candidates')) for x in rows)}))
