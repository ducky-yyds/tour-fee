"""Cache actual Commons candidates for the October enrichment, never publish search hits."""
import json, pathlib, time, requests
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'artifacts/china-experience-photo-research.json'
QUERIES = {
 'chengdu-sichuan-cooking': ['Sichuan Cuisine Museum', 'Pixian cuisine museum'],
 'guangzhou-canton-enamel': ['Canton enamel porcelain', '广彩'],
 'harbin-songhua-ice-games': ['Harbin Songhua winter ice'],
 'harbin-yabuli-ski': ['Yabuli ski'],
 'harbin-songhua-ferry': ['Harbin Songhua ferry'],
 'harbin-forest-botany': ['Heilongjiang Forest Botanical Garden', '黑龙江省森林植物园'],
 'harbin-beer-culture': ['Harbin beer museum', 'Harbin beer'],
 'lijiang-lashi-birds': ['Lashi Lake birds', 'Lashi Lake'],
 'lijiang-baisha-tie-dye': ['Yunnan tie dye', 'Baisha Lijiang'],
 'nanjing-qinhuai-boat': ['Qinhuai boats night'],
 'nanjing-woodblock-printing': ['Jinling Sutra Press', '金陵刻经处'],
 'sanya-houhai-surf': ['Houhai Sanya', 'Sanya surfing'],
 'sanya-serenity-sailing': ['Serenity Sanya Marina', 'Sanya sailboat'],
 'suzhou-biluochun-tea': ['Biluochun tea plantation', 'Dongshan Suzhou tea'],
 'suzhou-kunqu-evening': ['Kunqu performance Suzhou'],
 'xian-huaqing-dance': ['Song Everlasting Sorrow Huaqing', 'Huaqing Palace night'],
 'lijiang-baisha': ['Baisha village Lijiang'],
}

def main():
 result = json.loads(OUT.read_text(encoding='utf8')) if OUT.exists() else {}
 session=requests.Session()
 session.headers['User-Agent']='TusuanTravelSubjectReview/1.0 (+https://github.com/ducky-yyds/tour-fee)'
 for key, queries in QUERIES.items():
  if key in result: continue
  candidates=[]
  for query in queries:
   try:
    response=session.get('https://commons.wikimedia.org/w/api.php',params={'action':'query','format':'json','generator':'search','gsrsearch':query+' filetype:bitmap','gsrnamespace':6,'gsrlimit':6,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':320},timeout=35)
    response.raise_for_status()
    for page in response.json().get('query',{}).get('pages',{}).values():
     if page.get('imageinfo'): candidates.append({'title':page['title'], 'query':query, **page['imageinfo'][0]})
   except Exception as error: print(key, str(error), flush=True)
   time.sleep(1.4)
  result[key]={'queries':queries,'candidates':list({r['title']:r for r in candidates}.values()),'reviewed':False}
  OUT.parent.mkdir(exist_ok=True, parents=True)
  OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  print(key,len(candidates),flush=True)

if __name__=='__main__':main()
