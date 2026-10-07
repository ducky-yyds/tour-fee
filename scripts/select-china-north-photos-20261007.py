"""Explicit subject selections from the northern China Commons research cache.

Only explicit matches below are publishable; search rank is never an approval.
City images and unresolved items are reported separately for the media maintainer.
"""
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RESEARCH=ROOT/'artifacts/china-north-20261007-photo-research.json'
# id | candidate index; reviewed against original source caption and subject.
SELECTIONS='''chengde|0
qinhuangdao|0
datong|0
pingyao|1
hailar|2
shenyang|0
dalian|1
changchun|3
yanji|0
yinchuan|2
chengde-mountain-resort|0
chengde-putuo|0
chengde-puning|2
chengde-museum|0
chengde-hammer-peak|0
chengde-sumeru|0
chengde-anyuan|0
chengde-pule|0
chengde-shuangta|0
chengde-rehe-confucian|0
chengde-wulie|0
chengde-jinshanling|0
chengde-dongcunrui|2
qinhuangdao-first-pass|0
qinhuangdao-old-dragon|0
qinhuangdao-old-town|0
qinhuangdao-jiaoshan|0
qinhuangdao-biluota|0
qinhuangdao-gold-coast|1
datong-yungang|0
datong-huayan|0
datong-shanhua|0
datong-nine-dragon|0
datong-walls|2
datong-dai-palace|1
datong-fahua|0
datong-guandi|0
datong-drum-tower|0
datong-hanging|1
datong-hengshan|1
datong-yong-an|0
datong-yingxian|0
pingyao-wall|0
pingyao-rishengchang|0
pingyao-county|0
pingyao-wenmiao|1
pingyao-shuanglin|1
pingyao-zhenguo|0
pingyao-chenghuang|0
pingyao-qingxu|0
pingyao-escort|0
pingyao-lei-house|0
pingyao-south-street|0
pingyao-market-tower|1
pingyao-catholic|1
pingyao-wang-courtyard|1
hohhot-dazhao|0
hohhot-xilitu|1
hohhot-five-pagoda|0
hohhot-general-office|0
hohhot-princess|0
hohhot-zhaojun|1
hohhot-great-mosque|2
hohhot-saishang|0
hohhot-wulanfu|2
hohhot-baota|1
hohhot-wusutu|0
hohhot-qingcheng|0
hailar-anti-fascist|1
hailar-mozhigle|1
shenyang-manchuria-office|0
shenyang-palace|0
shenyang-zhaoling|0
shenyang-fuling|0
shenyang-liaoning-museum|0
shenyang-industrial|0
shenyang-xinle|0
shenyang-zhongjie|1
shenyang-laobeishi|1
shenyang-xita|1
shenyang-zhongshan|0
shenyang-catholic|0
shenyang-beita|1
shenyang-hunhe|0
shenyang-botanical|0
changchun-puppet-palace|0
changchun-occupation-museum|1
changchun-jingyuetan|0
changchun-sculpture|0
changchun-jilin-museum|0
dalian-xinghai|1
dalian-bangchuidao|0
dalian-binhai|0
dalian-zhongshan|0
dalian-russian|0
dalian-donggang|0
dalian-heishijiao|1
dalian-natural-museum|0
dalian-modern-museum|0
dalian-jinshitan|0
dalian-discovery|2
dalian-lushun-museum|1
dalian-baiyu|0
yanji-folk-park|0
yanji-maoer|3
yanji-yanbian-museum|0
yanji-dinosaur-museum|0
yanji-yanbian-university|0
yanji-people-park|0
yanji-martyrs|1
yanji-west-market|1
yanji-water-market|0
yinchuan-western-xia|0
yinchuan-ningxia-museum|0
ex-chengde-paper-cut|0
ex-hohhot-shaomai-morning|0
ex-hohhot-dairy-tour|0
ex-hailar-milk-food|2
ex-hailar-buryat-buns|0
ex-hailar-horse-music|0
ex-dalian-tram|0
ex-dalian-cherry|1
ex-changchun-tram54|0
ex-changchun-film-dubbing|2
ex-yanji-ricecake|0
ex-yanji-kimchi|0
ex-yinchuan-eight-tea|0
hotel-hohhot-sheraton|0
hotel-hailar-hulunbeier|0
hotel-dalian-castle|0
hotel-dalian-kempinski|1
hotel-changchun-shangrila|0
food-chengde-donkey-roll|2
food-qinhuangdao-miancha|0
food-qinhuangdao-seafood|0
food-qinhuangdao-sesame-cake|0
food-datong-knife-noodles|0
food-pingyao-kaolao|0
food-hohhot-shaomai|1
food-hohhot-milk-tea|2
food-hohhot-hand-lamb|0
food-hohhot-cheese|1
food-hohhot-oat|1
food-hailar-buuz|1
food-hailar-roast-lamb|0'''

def selected():
    research=json.loads(RESEARCH.read_text('utf-8')); result={}
    for line in SELECTIONS.splitlines():
        id,ix=line.split('|'); r=research.get(id,{})
        if len(r.get('candidates',[]))<=int(ix): continue
        row={**r['candidates'][int(ix)],'name':r['name']}
        row['subjectReview']='selected-from-source-caption; visual review recorded separately'
        result[id]=row
    # Same named foods and same physical sites may reuse an exact photograph;
    # these are explicit assignments, never a city-background fallback.
    copies={'hohhot':'hohhot-dazhao','food-chengde-oat':'food-pingyao-kaolao',
            'food-hailar-hand-lamb':'food-hohhot-hand-lamb','ex-hohhot-milk-tea':'food-hohhot-milk-tea',
            'ex-datong-wood-architecture':'datong-huayan',
            'ex-dalian-beach-afternoon':'dalian-bangchuidao',
            'ex-yanji-costume':'yanji-folk-park'}
    for id,source in copies.items():
        if source in result:result[id]={**result[source],'name':research.get(id,{}).get('name',id),'copiedFrom':source}
    return result

if __name__=='__main__':
    rows=selected();path=ROOT/'artifacts/china-north-20261007-photo-selections.json'
    path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n','utf-8')
    print('Explicit selections:',len(rows))
