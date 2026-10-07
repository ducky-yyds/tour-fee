"""Explicit name aliases to recover real place subjects, never generic backdrops."""
import importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('east_photo_research',ROOT/'scripts/research-china-east-photos-20261007.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
mod.BASE=ROOT/'artifacts/china-east-assist-20261007'
dest=mod.BASE/'photo-candidates.json'
rows=mod.read(dest,{})
aliases={
 'jingdezhen-imperial':'"御窑"',
 'jingdezhen-sanbao':'"Sanbao" "Jingdezhen"',
 'jingdezhen-hutian':'"湖田"',
 'jingdezhen-fudao':'"Fuliang Yamen" -"国保碑"',
 'jingdezhen-red-tower':'"Dasheng Baota" -"国保碑"',
 'jingdezhen-yaoli':'"Yaoli"',
 'jingdezhen-dongbu':'"东埠"',
 'jingdezhen-gaoling':'"高岭" "景德镇"',
 'jingdezhen-sanlv':'"三闾庙"',
 'jingdezhen-changjiang':'"Chang River" "Jingdezhen"',
 'yangzhou-wenchang':'"Wenchang Pavilion" "Yangzhou"',
 'yangzhou-wudao':'"Wu Daotai"',
 'yangzhou-dongquan':'"东圈门"',
 'yangzhou-songjiacheng':'"宋夹城"',
 'yangzhou-shaobo':'"Shaobo"',
 'shaoxing-east-lake':'"东湖" "绍兴"',
 'shaoxing-xuwei':'"青藤书屋"',
 'shaoxing-qiujin':'"秋瑾故居" "绍兴"',
 'shaoxing-datong':'"大通学堂"',
 'shaoxing-fushan':'"府山" "绍兴"',
 'shaoxing-tashan':'"塔山" "绍兴"',
 'chaozhou-paifang':'"牌坊街" "潮州"',
 'chaozhou-city-wall':'"Chaozhou" "city wall"',
 'chaozhou-westlake':'"西湖" "潮州"',
 'chaozhou-qinglong':'"青龙古庙"',
 'chaozhou-fenghuang-tea':'"凤凰单丛"',
 'macau-dominic':'"St. Dominic\'s Church" "Macau"',
 'macau-guia':'"Guia Fortress"',
 'macau-maritime':'"Maritime Museum" "Macau"',
 'macau-grand-prix':'"Grand Prix Museum" "Macau"',
 'macau-taipa-village':'"Rua do Cunha"',
 'macau-tower':'"Macau Tower"',
}
for id,phrase in aliases.items():
    rec=rows.setdefault(id,{'id':id,'candidates':[]})
    # These explicit exceptions replace marker-only or wrong homonym candidates.
    if rec['candidates'] and id not in ('jingdezhen-fudao','jingdezhen-red-tower','yangzhou-wenchang','yangzhou-zhushi','shaoxing-east-lake','shaoxing-fushan','shaoxing-tashan','macau-dominic','macau-guia','macau-maritime'):continue
    q=phrase+' filetype:bitmap'
    try:
        r=mod.api('https://commons.wikimedia.org/w/api.php',{'generator':'search','gsrsearch':q,'gsrnamespace':6,'gsrlimit':5,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':400})
        pages=sorted(r.get('query',{}).get('pages',{}).values(),key=lambda x:x.get('index',99))
        for p in pages:
            if mod.eligible(p):
                c=mod.candidate(p,'commons-explicit-alias',q)
                if c['photoFile'] not in [v['photoFile'] for v in rec['candidates']]:rec['candidates'].append(c)
        print(id,len(rec['candidates']),flush=True)
    except Exception as e:print(id,str(e),flush=True)
    mod.write(dest,rows)
