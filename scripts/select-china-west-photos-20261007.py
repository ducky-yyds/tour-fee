"""Publish filename/subject checked Commons candidates, not broad search hits.

Image bytes and original archiving are handled by the existing media maintenance.
Selection is explicit and repeatable; unresolved subjects remain in research data.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
cache=ROOT/'artifacts/china-west-photo-research'
PICKS={
'jinghong-botanical-garden':0,'jinghong-dai-garden':0,'jinghong-ethnic-museum':0,'jinghong-forest-park':0,'jinghong-gaozhuang':0,'jinghong-jinuo':0,'jinghong-man-ge':0,
'kunming-black-dragon-pool':0,'kunming-botanical-garden':0,'kunming-daguan':0,'kunming-dongchuan':1,'kunming-ethnic-museum':0,'kunming-ethnic-village':0,'kunming-golden-temple':0,'kunming-green-lake':0,'kunming-guandu':0,'kunming-jiuxiang':0,'kunming-kunming-old-street':1,'kunming-military-academy':0,'kunming-provincial-museum':0,'kunming-railway-museum':0,'kunming-stone-forest':0,'kunming-yuantong':0,
'lhasa-ani-tsangkhung':0,'lhasa-barkhor':0,'lhasa-chagpori-view':0,'lhasa-drepung':0,'lhasa-ganden':0,'lhasa-jokhang':0,'lhasa-namtso':0,'lhasa-norbulingka':0,'lhasa-potala':0,'lhasa-ramoche':0,'lhasa-sera':0,'lhasa-tibet-museum':0,'lhasa-yerpa':0,'lhasa-zongjiao':0,
'nyingchi-basum':0,'nyingchi-kading':0,'nyingchi-lamaling':0,'nyingchi-lulang-town':0,'nyingchi-yarlung-canyon':0,
'tengchong-beihai':0,'tengchong-cemetery':0,'tengchong-heshun':0,'tengchong-li-genyuan':0,'tengchong-re-hai':1,'tengchong-volcano':0,'tengchong-war-museum':0,
'xining-beichan':0,'xining-dongguan':0,'xining-laoye':0,'xining-ma-bufang':0,'xining-renmin':0,'xining-sun-moon':0,'xining-taer':1,
'lanzhou-gansu-museum':0,'lanzhou-xiguan':0,'lanzhou-yellow-river-building':0,
'zhangye-binggou':0,'zhangye-colorful-danxia':0,'zhangye-dafo':0,'zhangye-mati':0,'zhangye-shandan-hall':2,
'urumqi-botanical':2,'urumqi-geology-museum':0,'urumqi-grand-bazaar':1,'urumqi-heavenly-lake':0,'urumqi-hongshan':0,'urumqi-people-park':0,'urumqi-science-museum':1,'urumqi-shanxi-mosque':1,'urumqi-shuimogou':0,'urumqi-tianshan-canyon':0,'urumqi-wenmiao':0,'urumqi-xinjiang-museum':0,
'kashgar-old-consulate':0,
'yining-baitullah':0,'yining-huiyuan':0,'yining-ili-museum':0,'yining-princess':1,'yining-sayram':0,'yining-sha-an':0,
'ex-jinghong-garden-night':0,'ex-jinghong-paper-making':0,'ex-jinghong-rainforest-walk':0,'ex-kashgar-instrument-demo':0,'ex-kunming-flower-market':2,'ex-kunming-tea-afternoon':0,'ex-lanzhou-qin-opera':0,'ex-lhasa-shoton':0,'ex-tengchong-earthen-hotpot':0,'ex-tengchong-wetland-birds':0,'ex-urumqi-nan-breakfast':0,'ex-urumqi-uyghur-music':0,'ex-yining-river-picnic':0,'ex-zhangye-danxia-light':0,
}
packs={'attraction':{},'experience':{},'food':{},'hotel':{}}
VISUAL_REJECT={
 'lhasa-yerpa':'1993 monastery ruins do not represent current visitor appearance',
 'nyingchi-yarlung-canyon':'satellite image rather than visitor landscape photograph',
 'tengchong-cemetery':'inscription close-up is unsuitable as cemetery cover',
 'xining-beichan':'person and incense burner close-up instead of place overview',
 'lanzhou-yellow-river-building':'moving blurred roadside shot',
 'urumqi-geology-museum':'sign close-up only; seek building or exhibit view',
 'urumqi-tianshan-canyon':'entrance stone sign only; seek landscape view',
 'ex-jinghong-paper-making':'line drawing, not a real photograph',
 'ex-urumqi-uyghur-music':'tourist portrait dominates instrument illustration',
}
for eid,idx in PICKS.items():
    if eid in VISUAL_REJECT:continue
    f=cache/(eid+'.json')
    if not f.exists():continue
    item=json.loads(f.read_text(encoding='utf-8'))
    if idx>=len(item.get('candidates',[])):continue
    picked=item['candidates'][idx]
    if not any(x in picked.get('license','') for x in ['CC BY','CC0','Public domain']):continue
    theme=item['kind']=='experience'
    row={k:picked[k] for k in ['photoFile','sourceUrl','license','licenseUrl','author'] if picked.get(k)}
    row.update(imageScope='related-theme' if theme else 'exact-place',
        imageContextNote=(item['name']+'相关主题实景，用于说明环境或文化，不代表所预订商家的场次、餐品或服务。' if theme else item['name']+'实景或对应展陈。'),
        checkedAt='2026-10-07',reviewBasis='Commons filename, description and indexed contact-sheet image checked',
        visualReview={'status':'passed','checkedAt':'2026-10-07','method':'indexed-contact-sheet','artifact':'artifacts/china-west-visual-review/index.json'})
    if eid=='ex-jinghong-rainforest-walk':row['imageContextNote']='西双版纳热带植物园雨林实景，示意当地雨林植被，不是基诺山该向导线路的实拍。'
    if eid=='ex-jinghong-garden-night':row['imageContextNote']='西双版纳热带植物园白天实景，说明活动所在环境，不代表夜观物种可遇见。'
    if eid=='ex-tengchong-earthen-hotpot':row['imageContextNote']='腾冲土锅子成品实拍，摄于北京云南菜餐厅，具体餐馆份量与配料不同。'
    if eid=='xining-taer':row['visualReview']['artifact']='artifacts/china-west-visual-review/xining-taer-replacement.jpg';row['visualReview']['method']='single-image';row['imageContextNote']='塔尔寺院落实景，摄于 2024 年。'
    if eid=='ex-urumqi-uyghur-music':row['imageContextNote']='喀什传统乐器相关实景，示意新疆乐器文化，不是乌鲁木齐所选演出的场地。'
    packs[item['kind']][eid]=row
for kind,rows in packs.items():
    folder={'attraction':'place-photo-expansion','experience':'experience-photo-expansion','food':'food-photo-expansion','hotel':'hotel-photo-expansion'}[kind]
    if rows:(ROOT/'data'/folder/'china-west-20261007.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:len(v) for k,v in packs.items()}))
