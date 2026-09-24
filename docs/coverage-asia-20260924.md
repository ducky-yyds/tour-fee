# 亚洲城市覆盖与真实图片补充 · 2026-09-24

新增内容：`data/place-expansion/coverage-asia-20260924.json`，19 城、99 条。旧体验图片映射：`data/experience-photo-expansion/asia-20260924.json`，71 条。图片候选查询与人工选择保存在 `artifacts/asia-coverage-photo-candidates*.json` 和 `artifacts/select-asia-coverage-photos.py`。未修改共享城市、媒体或页面文件；未运行应用测试、构建或提交。

## 逐城覆盖

“原有”取任务开始时 `artifacts/city-under20-20260924.json` 的景点＋体验数量，不含酒店与食物。远郊独立片区没有伪装成市内短停，均设为可选且不默认自动安排；展示游览时间不含市区往返。

| 城市 | 原有 | 新增 | 补充后 | 新增主题 |
|---|---:|---:|---:|---|
| 天津 | 11 | 20 | 31 | 博物馆、艺术展览、建筑文化、历史建筑、宗教文化、戏曲文化、公园休闲、城市观景、历史山野、古建筑、自然风景、文学文化 |
| 札幌 | 17 | 3 | 20 | 艺术自然、博物馆、科学文化 |
| 福冈 | 17 | 3 | 20 | 博物馆、艺术展览、海岛自然 |
| 广岛 | 17 | 3 | 20 | 艺术展览、自然科普 |
| 那霸 | 17 | 3 | 20 | 历史教育、公园休闲、湿地观察 |
| 釜山 | 17 | 3 | 20 | 博物馆、海岸地质、历史教育 |
| 济州岛 | 17 | 3 | 20 | 自然风景、火山地质、海岸地质 |
| 甲米·奥南 | 19 | 1 | 20 | 自然风景 |
| 万宁 | 16 | 4 | 20 | 海岸地质、植物科普、饮食文化 |
| 陵水 | 18 | 2 | 20 | 山海自然、地方文化 |
| 深圳 | 15 | 5 | 20 | 植物科普、艺术展览 |
| 长沙 | 17 | 3 | 20 | 博物馆、艺术展览、历史建筑 |
| 武汉 | 17 | 3 | 20 | 考古博物馆、艺术展览 |
| 哈尔滨 | 16 | 4 | 20 | 博物馆、历史文化、历史教育、建筑休闲 |
| 敦煌 | 15 | 5 | 20 | 石窟艺术、丝路遗址、阅读文化、田园生活 |
| 张家界 | 15 | 5 | 20 | 博物馆、地质科普、洞穴自然、河谷体验、历史教育 |
| 延安 | 10 | 10 | 20 | 历史文化、石窟山野、文学艺术、田园历史、石窟艺术、古柏文化、河谷地质、地方休闲、地方文化、田园生活 |
| 南昌 | 11 | 9 | 20 | 博物馆、工艺艺术、考古博物馆、古村文化、田园自然、自然风景、历史建筑、历史教育、湖畔休闲 |
| 遵义 | 10 | 10 | 20 | 石刻文化、山野历史、地方体验、河谷地质、洞穴自然、河谷自然、教育历史、酿造文化、产业文化、工业文化 |

## 核对边界与排除

- 本批价格全部为编辑预算 `estimate`，`checkedAt:null`。官网可确认部分单项票价，但未把“预算区间”标为现价或最低最高价。零门票不代表无须预约；特展、接驳、演出与餐饮另计。
- 后安粉条目门票为零；一餐15–35元写入介绍，明确纳入日常餐饮，避免又计成景点门票。
- 那霸市历史博物馆因搬迁自2025-09-01休馆，未加入；以官方2026年更新为准，未采用仍显示正常开放的旧英文页。[那霸官方公告](https://www.city.naha.okinawa.jp/shisetsu/bunka/1004864/1004866.html)。
- 陵水椰田古寨出现暂停开放信息；武汉张之洞馆出现升级改造信息；万州学宫涉及学校管理范围；济州万丈窟开放信息未充分确认。本批未拿这些项目凑数。
- 南昌市博物馆新馆建设中的信息易与旧馆或滕王阁展示混淆，改为2026年地方文旅部门仍列出地址和开放时间的南昌瓷板画艺术博物馆。[红谷滩区文旅局](https://hgt.nc.gov.cn/hgtqrmzf/hgtfm/202604/9ae550b04d86458481e2602661a64306.shtml)。
- 贵州酒文化博物馆只有较旧机构名录可以确认，改用2026年仍有运营报道的遵义1964文化创意园与三线博物馆。[2026-09-03地方机构转载现场报道](https://www.yp.gov.cn/contents/2026/09/03/receive-5094ecdd-f009-4a70-9937-191cbc7d2145.html)。
- 国外岛屿、国内县域景区均保留实际名称；敦煌榆林窟、锁阳城明确在瓜州，延安乾坤湾明确陕西延川侧，遵义清溪峡明确绥阳而非四川甘洛同名峡谷。
- 来源涵盖旅游局、场馆、经营机构、地方报道及少量旅行平台；`sourceReferences.kind` 已区分，不把携程、去哪儿、维基百科及媒体报道冒充官网。来源核对日期不意味着逐馆实时致电确认开放。

## 图片范围与许可

共选择170个对应条目（99新增地点＋71旧体验）。范围分布：{'nearby': 60, 'related-theme': 37, 'exact-place': 73}。全部使用Commons上标注CC许可、CC0或公有领域的照片/实物影像，无新增AI图。根任务统一下载与写署名。

没有把搜索首图直接认作对应地点：已剔除梁启超新会故居、天津美术馆效果图、杭州黄龙洞地铁站、云南何叔衡像、四川甘洛清溪峡、旧江西馆和与标题偶然匹配的列车广告等。部分明确实拍主体的候选另下载缩略图检查；不是对170张全部进行逐像素视觉审图。

`exact-place`表示该场馆/地点或其馆内展品，仍可能是历史照片。`nearby`表示同城相关地点、同海域或同城市主题。`related-theme`表示异地同主题照片、工艺实物或地点未明确的文化主题，文案均写出实际对象和差异，不能作为该运营商设施、菜单或当日景象的证明。

需要继续优先替换为更精确现场图的条目：土家三下锅目前用都灵餐厅中式牛肉干锅说明共享锅物；石岩湿地用香港湿地公园水鸟；1964园区用深圳华侨城创意园说明旧厂转型；乌江寨用贵州西江村寨夜景；云门囤与清溪峡用贵州赤水河。这些均明确 `related-theme`，不得改成当地实拍标签。

## 每城新增清单与信息来源

### 天津

- **天津自然博物馆**：从古生物化石到生态展柜认识北方自然史；适合雨天与亲子慢看，基本陈列与特展分开核对。 [资料](https://www.tjnhm.com/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Tianjin_Natural_History_Museum_Lobby.jpg)。
- **天津美术馆**：把下午留给近现代绘画与当期展览；在文化中心可与自然博物馆二选一，避免同日看展过满。 [资料](https://www.tjmsg.cn/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A4%A9%E6%B4%A5%E7%BE%8E%E6%9C%AF%E9%A6%86.jpg)。
- **国家海洋博物馆**：从海洋生物、航海到海洋文明看完整专题；位于滨海新区，须单独安排往返及预约。 [资料](https://www.nmmc.cc/panoramic/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:National_Maritime_Museum_of_China_20211002.jpg)。
- **瓷房子**：观察瓷片、古瓷构件与洋楼外墙的组合；入馆和街边外观体验不同，按兴趣决定是否购票。 [资料](https://whly.tj.gov.cn/WSBSYZXBS4230/CXFW5394/AJJQCX8399/202101/t20210108_5294075.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A4%A9%E6%B4%A5%E7%93%B7%E6%88%BF%E5%AD%90.jpg)。
- **静园与溥仪寓居史**：走进庭院与旧居陈列，了解溥仪寓居天津的生活；重点是建筑内部与史料，并非只拍外墙。 [资料](https://whly.tj.gov.cn/XWDTYXWZX6562/MTJJ8464/202008/t20200817_3486123.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A4%A9%E6%B4%A5%E9%9D%99%E5%9B%AD2022.5_(1).jpg)。
- **庆王府**：在重庆道看中西合璧院落与近代居住格局；庭院、展览和餐饮空间开放范围分别确认。 [资料](https://whly.tj.gov.cn/XWDTYXWZX6562/MTJJ8464/202008/t20200817_3486123.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%BA%86%E7%8E%8B%E5%BA%9C%E5%85%A8%E6%99%AF.jpg)。
- **梁启超纪念馆与饮冰室**：通过书斋、文献与家风陈列认识梁启超；两栋旧居合并为一次参观，不把书房拆成第二个景点。 [资料](https://www.tj.gov.cn/sy/tjxw/202601/t20260117_7225654.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%A2%81%E5%90%AF%E8%B6%85%E6%97%A7%E5%B1%85.jpg)。
- **杨柳青石家大院**：看清代宅院的砖木雕、院落秩序与地方生活陈列；与市中心相隔较远，预留半日。 [资料](https://whly.tj.gov.cn/XWDTYXWZX6562/MTJJ8464/202008/t20200817_3486123.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Shi_Family_Grand_Courtyard_2009_05_07_8166.jpg)。
- **大悲禅院**：在海河附近认识汉传寺院的殿堂秩序与香火生活；尊重礼佛，按现场规定摄影。 [资料](https://www.dabeichanyuan.com.cn/dbcy/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Tianjin_Dabei_temple.jpg)。
- **天津文庙**：沿中轴观察孔庙建筑和科举教育文化，与周边商业街的观光氛围形成不同的停留。 [资料](https://whly.tj.gov.cn/XWDTYXWZX6562/TZGGYXXGKX5995/202310/W020231016545432384134.pdf)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A4%A9%E6%B4%A5%E6%96%87%E5%BA%99.jpg)。
- **广东会馆与戏楼**：看岭南会馆建筑与木构戏楼，认识津门商旅和戏曲的联系；演出须另查场次。 [资料](https://whly.tj.gov.cn/XWDTYXWZX6562/TZGGYXXGKX5995/202310/W020231016545432384134.pdf)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A4%A9%E6%B4%A5%E5%B9%BF%E4%B8%9C%E4%BC%9A%E9%A6%862023.3_(2).jpg)。
- **北宁公园**：沿湖、亭廊与花木慢看这座与铁路历史相关的老公园；适合避开景区人潮的下午。 [资料](https://csgl.tj.gov.cn/zwgk_57/zfxxgk01/fdzdgknr/qtfdgkxx1/202212/W020241209555771994382.pdf)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%8C%97%E5%AE%81%E5%85%AC%E5%9B%AD20130831.jpg)。
- **水上公园湖畔**：在大面积湖岛和园林中留一个休闲时段；游乐设施独立收费，局部改造范围以公告为准。 [资料](https://csgl.tj.gov.cn/zwgk_57/zfxxgk01/fdzdgknr/qtfdgkxx1/202212/W020241209555771994382.pdf)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Tianjin_Water_Park_West_Lake_the_Island_in_the_Lake.jpg)。
- **天津之眼摩天轮**：乘观景舱看海河两岸，乘坐与地面拍摄分开安排；恶劣天气、检修和排队可能影响时段。 [资料](https://rwtj.tjl.tj.cn/dbjz/index.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Tianjin_Eye_20160514.jpg)。
- **天塔观景与湖区**：从高处辨认天津城区与湖面，选择能见度较好的时段；登塔与餐饮套餐分别核价。 [资料](https://whly.tj.gov.cn/XWDTYXWZX6562/MTJJ8464/202008/t20200817_3486123.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Tianjin_TV_Tower.jpg)。
- **黄崖关长城**：走山地长城看关城与险要地形；位于蓟州北部，适合单独一日，雨雪天需核对步道开放。 [资料](https://whly.tj.gov.cn/TJSWHHLYJ/gabsycs/mtjjgh/202503/t20250315_6883282.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Huangyaguan_05_(4921058465).jpg)。
- **蓟州独乐寺**：近看辽代木构观音阁和塑像，适合建筑爱好者；蓟州往返市区不应塞进短暂停留。 [资料](https://whly.tj.gov.cn/TJSWHHLYJ/gabsycs/mtjjgh/202503/t20250315_6883282.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Dule_Temple_1.jpg)。
- **盘山山林与古寺**：按体力选择山林石阶与古寺路线；索道另计，蓟州山地游需完整白天与往返交通。 [资料](https://whly.tj.gov.cn/TJSWHHLYJ/gabsycs/mtjjgh/202503/t20250315_6883282.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E7%9B%98%E5%B1%B1_-_Mount_Panshan_-_2015.10_-_panoramio.jpg)。
- **望海楼教堂外观**：在海河东岸观察教堂立面与桥景；此项按公共区域外观规划，入内以教会当日安排为准。 [资料](https://rwtj.tjl.tj.cn/dbjz/index.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%9C%9B%E6%B5%B7%E6%A5%BC%E6%95%99%E5%A0%82.jpg)。
- **曹禺故居纪念馆**：从剧作、手稿与生活陈列认识《雷雨》作者；和意式风情区漫步不同，是一段文学主题参观。 [资料](https://rwtj.tjl.tj.cn/dbjz/index.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%B0%91%E4%B8%BB%E9%81%9325%E5%8F%B7%E6%9B%B9%E7%A6%BA%E6%97%A7%E5%B1%85.jpg)。

### 札幌

- **札幌艺术之森**：在林间雕塑与室内展馆之间慢看；公共园区、雕塑园和当期特展分别计费，冬季开放方式不同。 [资料](https://visit.sapporo.travel/discover/art-culture/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Sapporo_Art_Park._(48584101271).jpg)。
- **北海道博物馆**：从自然、阿伊努文化与北海道历史认识岛屿；与开拓之村分属独立展馆，可按体力择一深入。 [资料](https://www.hm.pref.hokkaido.lg.jp/en/index/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Hokkaido_Museum.JPG)。
- **北海道大学校园与综合博物馆**：沿公开校园区域到综合博物馆看科学研究与标本；教学空间不随意进入，博物馆闭馆日另查。 [资料](https://visit.sapporo.travel/discover/art-culture/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:The_Hokkaido_University_Museum.png)。

### 福冈

- **福冈市博物馆**：从金印、海上交流和市民生活认识博多湾；基础票与特展分开，周一等闭馆日先确认。 [资料](https://museum.city.fukuoka.jp/en/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:FukuokaCity_Museum_2018.jpg)。
- **福冈亚洲美术馆**：用一组亚洲近现代艺术作品认识不同社会与生活；常设收藏之外，特展、活动另看日程。 [资料](https://gofukuoka.jp/en/articles/detail/c1eefa03-6319-4d6d-80f6-330408729e22)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Fukuoka_Asian_Art_Museum_20200828.jpg)。
- **能古岛花园与博多湾**：搭渡轮再转岛内交通，在花田俯瞰博多湾；花期依天气，船票与接驳不含在园区预算中。 [资料](https://www.gofukuoka.jp/spots/detail/26801)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Flowers_in_Nokonoshima_Island_Park.jpg)。

### 广岛

- **广岛县立美术馆**：结合地方艺术与不同主题特展，给缩景园附近增加一段室内文化时间；按当期展览核价。 [资料](https://dive-hiroshima.com/en/course/art-museum-walk/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Hiroshima_Prefectural_Art_Museum_01.jpg)。
- **广岛美术馆**：集中看西方近代绘画与日本近现代艺术；馆藏和展览轮换，不承诺特定作品一直展出。 [资料](https://dive-hiroshima.com/en/course/art-museum-walk/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Hiroshima_Museum_of_Art.jpg)。
- **广岛市植物公园**：在温室与室外植物区认识不同气候的植物；从五日市站接驳，适合独立半日。 [资料](https://www.city.hiroshima.lg.jp/living/park-green/1005983/1026357/1018194.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Hiroshima_Botanical_Garden.jpg)。

### 那霸

- **对马丸纪念馆**：从疏散船、遗物与幸存者记忆理解战争中的平民经历；在若狭海边，周四等休馆日先核对。 [资料](https://www.tsushimamaru.or.jp/about.php)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Tsushima_Maru_Memorial_Museum,_4_December_2024.jpg)。
- **末吉公园林间步道**：沿首里周边的林间路径听鸟鸣、看亚热带植物，坡地石阶雨后较滑；适合缓慢探索。 [资料](https://www.city.naha.okinawa.jp/shisetsu/sports/1007498/1004874.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Sueyoshi_Park_Naha_Okinawa_Japan01s5.jpg)。
- **漫湖水鸟湿地中心**：在观景设施看潮滩、水鸟、弹涂鱼与红树林；冬季鸟类和潮位各有变化，不保证见到特定物种。 [资料](https://www.manko-mizudori.net/english/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Manko_Waterbird_and_Wetland_Center_202206.jpg)。

### 釜山

- **釜山博物馆**：用考古、港口与近代生活陈列认识釜山，适合把海滨行程和历史背景连接起来。 [资料](https://museum.busan.go.kr/eng/busaneng)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Busan_museum.JPG)。
- **五六岛天空步道与海崖**：从开放步道看海蚀崖与近海岩岛；强风时天空步道可能关闭，不跨越围挡。 [资料](https://www.busan.go.kr/geopark_en/oryukdo)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Oryukdo_Skywalk_in_Busan,_South_Korea.jpg)。
- **联合国和平纪念馆**：通过展览认识朝鲜战争、联合国参与及和平议题；与墓园是不同的室内参观内容。 [资料](https://www.unpm.or.kr/un2022_eng/sub.php?MenuID=8)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:View_from_United_Nations_Peace_Memorial_Hall_towards_UN_Memorial_Cemetery.jpg)。

### 济州岛

- **榧子林古树步道**：在古老榧树群和火山土步道中认识岛上的森林；走指定步道，雨后注意根系与路面。 [资料](https://www.visitjeju.net/pdf/Official%20Jeju%20Tourism%20Guidebook_en.pdf)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Bijarim_nutmeg_forest_jeju_korea_4.jpg)。
- **拒文岳预约生态导览**：随预约导览认识火山口与熔岩地形；并非可随到随走的登山点，先确认名额和路线。 [资料](https://www.visitjeju.net/pdf/Official%20Jeju%20Tourism%20Guidebook_en.pdf)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Geomunoreum.jpg)。
- **大浦海岸柱状节理**：沿观景步道看冷却熔岩形成的柱状岩壁和海浪；位于中文旅游区，避免跨岛来回赶路。 [资料](https://m.visitjeju.net/en/detail/view?contentsid=CNTS_000000000020476&menuId=DOM_000001817000000001)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Daepo_Jusangjeolli_Cliff_01.jpg)。

### 甲米·奥南

- **翡翠池与热带森林步道**：沿林间步道看清澈泉池与热带植被；远离奥南，预留单独半日以上，按保护区当日规则入水。 [资料](https://www.tourismthailand.org/Articles/10-things-to-do-in-krabi)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Emerald_pool_park,_Krabi_province,_Thailand_2018_6.jpg)。

### 万宁

- **大花角卵石海岸**：看圆润卵石与浪花，不下水游泳；基础设施少，避开大浪与临时封闭区，停车另计。 [资料](https://you.ctrip.com/sight/wanning846/1714867.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A4%A7%E8%8A%B1%E8%A7%92%E6%B3%A1%E6%B2%AB%E6%B5%AA2005_-_panoramio.jpg)。
- **山钦湾黑礁海岸**：从可通行岸段看黑色礁石与海蚀形态；不把洞穴探险作为默认项目，涨潮与大浪时不靠近洞口。 [资料](https://news.hainan.net/zixun/2023/12/21/4762252.shtml)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A4%A7%E8%8A%B1%E8%A7%92%E6%B3%A1%E6%B2%AB%E6%B5%AA2005_-_panoramio.jpg)。
- **兴隆南药园**：认识南药种质保存与肉豆蔻、丁香等热带植物；预约和开放范围先向园方确认，不采摘或自行试吃。 [资料](https://www.implad.ac.cn/about.aspx?CateId=229)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:Xinglong_Tropical_Botanical_Garden_(19).jpg)。
- **后安镇的一碗后安粉**：把早餐留给后安粉的米条、汤底和配料，沿镇内正常营业小店自选；单人一餐可预留15–35元，计入日常餐饮。 [资料](https://news.hainan.net/zixun/2023/12/21/4762252.shtml)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Hou%27anfen_at_a_restaurant_in_Sanya_(20230324201749).jpg)。

### 陵水

- **红角岭登高看海**：沿开放栈道看陵水山海地形，避开正午暴晒与雨后湿滑；不进入未开放山路。 [资料](https://news.hainan.net/hainan/shixian/lingshui/2025/09/26/4797722.shtml)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:Coast_of_Lingshui.jpg)。
- **文罗坡村红色与黎乡记忆**：看村内主题展陈、浮雕与乡村生活，认识黎族文化和革命记忆；展室开放另查，尊重居民。 [资料](https://lsrm.hinews.cn/xinwen/show-23743.html)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Maison_Li,_Sanya.jpg)。

### 深圳

- **仙湖植物园**：在专类植物园与湖边认识亚热带植物，弘法寺并入同一次园区游览；园内巴士另计。 [资料](https://www.szbg.ac.cn/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:FAIRYLAKE_BOTANICAL_GARDEN_(4).jpg)。
- **海上世界文化艺术中心**：看槇文彦建筑与设计主题展览，滨海公共空间和收费展馆分开选择；展览随档期变化。 [资料](https://www.sz.gov.cn/szzt2010/szwtt/wtcg/whcg/content/post_11131232.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Seaworld_CAC1.jpg)。
- **关山月美术馆**：从岭南画派与二十世纪中国美术看深圳的文化一面；与莲花山步行可组成轻松半日。 [资料](https://www.sz.gov.cn/szzt2010/szwtt/wtcg/whcg/content/post_11127115.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:SZ_%E6%B7%B1%E5%9C%B3_Shenzhen_%E7%A6%8F%E7%94%B0_Futian_%E7%B4%85%E8%8D%94%E8%B7%AF_Hongli_Road_%E9%97%9C%E5%B1%B1%E6%9C%88%E7%BE%8E%E8%A1%93%E9%A4%A8_Guan_Shanyue_Art_Museum_exhibition_January_2026_N13P_13.jpg)。
- **深圳美术馆新馆**：在龙华新馆看当期艺术展览与大尺度建筑空间；主题活动可能需另约，不与东湖馆混淆。 [资料](https://www.sz.gov.cn/szzt2010/szwtt/wtcg/whcg/content/post_11127097.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:SZ_Shenzhen_Longhua_%E6%B7%B1%E5%9C%B3%E7%BE%8E%E8%A1%93%E9%A4%A8_Shenzhen_Art_Museum_1616pm_August_2026_N13P_110.jpg)。
- **何香凝美术馆**：在华侨城看何香凝艺术与相关专题展；和周边商业休闲结合，按展览公告确认开放。 [资料](https://wtl.sz.gov.cn/ggfw/whl/msgylb/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:He_Xiangning_Art_Museum1.jpg)。

### 长沙

- **长沙简牍博物馆**：通过走马楼吴简与漆木器认识纸张普及前的记录方式，也能读到古代长沙的日常事务。 [资料](https://www.chinajiandu.cn/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Changsha_Jiandu_Museum.jpg)。
- **谢子龙影像艺术馆**：用老照片和当期影像展看历史如何被记录；建筑外观与馆内收费展览分开选择。 [资料](https://xjxq.hunan.gov.cn/hnxjxq/sytpxw/202003/t20200318_11814798.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Xie_Zilong_Photography_Museum_2023040102.jpg)。
- **天心阁古城墙**：沿保留的城墙和阁楼观察老长沙城市格局，公园漫步与登阁票分别核对。 [资料](https://hunan.gov.cn/hnszf/c101474/202108/t20210827_20403927.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Changsha_Tianxin_Pavilion.jpg)。

### 武汉

- **盘龙城遗址博物院**：把青铜器陈列与遗址现场连起来看，认识商代长江流域中心；通常周一闭馆，需留足入园时间。 [资料](https://www.plcsmuseum.com.cn/Account/Index)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Lijiazui_Site_at_Panlong_City_National_Archaeological_Park.jpg)。
- **武汉美术馆琴台馆**：在月湖旁的梯田形建筑里看当代艺术，选择当期展览；公共屋面是否可走以现场开放为准。 [资料](https://wlj.wuhan.gov.cn/zfxxgk/fdzdgknr/jgjj/zsdw/202310/t20231017_2281350.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Wuhan_Art_Museum_(Qintai)_2026_04_10.jpg)。
- **武汉美术馆汉口馆**：在原金城银行建筑里看艺术展，兼看汉口商业城市留下的建筑细节；与琴台馆是不同馆址。 [资料](https://wlj.wuhan.gov.cn/zfxxgk/fdzdgknr/jgjj/zsdw/202310/t20231017_2281350.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Wuhan_Art_Museum.jpg)。

### 哈尔滨

- **哈尔滨市博物馆**：从城市记忆与专题陈列认识哈尔滨，选择主要展馆深入；特展和分馆请分别确认位置。 [资料](https://www.hrbmuseum.cn/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Harbin_Museum_1.jpg)。
- **哈尔滨犹太历史文化纪念馆**：在原犹太新会堂看侨民生活与城市交往史；参观前核对当期开放，尊重纪念空间。 [资料](https://en.wikipedia.org/wiki/Harbin_Museum_of_Jewish_History_and_Culture)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Harbin,_New_Synagogue.jpg)。
- **东北烈士纪念馆**：通过人物史料理解东北抗日斗争，旧建筑与陈列合并参观；多分馆地址不同，按本馆预约。 [资料](https://wlt.hlj.gov.cn/wlt/c114195/202011/c00_31051874.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E4%B8%9C%E5%8C%97%E7%83%88%E5%A3%AB%E7%BA%AA%E5%BF%B5%E9%A6%862017%E5%A4%8F.jpg)。
- **伏尔加庄园俄式建筑与园林**：认识哈尔滨俄式建筑的复建展示，在阿什河畔慢游；这是主题庄园，非保留完好的原始旧街区。 [资料](https://paper.people.com.cn/rmrbhwb/page/2015-01/05/08/rmrbhwb2015010508.pdf)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%93%88%E5%B0%94%E6%BB%A8%E5%9C%A3%E5%B0%BC%E5%8F%A4%E6%8B%89%E6%95%99%E5%A0%82_%E4%BC%8F%E5%B0%94%E5%8A%A0%E5%BA%84%E5%9B%AD_20240519.jpg)。

### 敦煌

- **瓜州榆林窟**：在管理人员引导下看普通开放洞窟的壁画和彩塑；位于瓜州，需另留长途往返，不与莫高窟赶同半日。 [资料](https://dunhuangcaves.org/skxl/ylk.htm)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Yulin_Caves_Jiuquan_Gansu_China_%E9%85%92%E6%B3%89_%E6%A5%A1%E6%9E%97%E7%AA%9F_-_panoramio_(4).jpg)。
- **瓜州锁阳城遗址**：看戈壁古城、城墙与周边遗迹，认识丝路城市的水土关系；与敦煌市区相距较远，宜专程一日。 [资料](https://touch.piao.qunar.com/touch/detail_1570.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Suoyang_City_02.jpg)。
- **悬泉置遗址与展示中心**：从汉简、邮驿和遗址展示认识使者在丝路上如何停驻；展示中心、遗址接驳及讲解费用分开核对。 [资料](https://thirdpage.thepaper.cn/h5/jrtt/33041104)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%82%AC%E6%B3%89%E7%BD%AE%E6%B1%89%E7%AE%80.jpg)。
- **敦煌书局阅读一小时**：在党河妙街的主题书店翻敦煌壁画、乐舞与民俗书籍，为石窟参观补上背景；购书饮品另计。 [资料](https://www.nationalreading.gov.cn/ydkj/swsh/202406/t20240628_853662.html)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Digitisation_of_a_Dunhuang_manuscript.jpg)。
- **阳关镇葡萄园与农家风味**：成熟季到正常接待游客的葡萄园认识绿洲农业，先联系园主确认采摘；非收获季改为村镇观察。 [资料](https://nmfsj.moa.gov.cn/sy_banner/202609/t20260915_6487679.htm)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Journey_of_Discovery_-_Korla_to_Dunhuang_(7092750839).jpg)。

### 张家界

- **张家界市博物馆**：先看地质、历史与土家生活陈列，再进山更容易读懂峰林；常设展免费，通常周一闭馆。 [资料](https://zjjsmuseum.com/)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Tujia_women.jpg)。
- **武陵源地质公园博物馆**：用模型、化石与地貌展陈理解砂岩峰林；它是室内科普馆，不把森林公园山峰拆分凑数。 [资料](https://www.zhangjiajieuggp.org.cn/info_show.php?nt_id=50)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:Sandstone_spire_forest_Zhangjiajie_Hunan.jpg)。
- **九天玄女洞与峰恋溪**：把地下洞穴与相连溪谷作为一段完整游览；位于桑植方向，需另算交通和所选联票。 [资料](https://maoyanhe.cn/)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:Huanglongdong.JPG)。
- **茅岩河峡谷水上游**：按季节选择平湖游或开放河段的水上项目，认识西线峡谷；洪水、天气及运营班次需先核对。 [资料](https://maoyanhe.cn/)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:LishuiheByHighestBridges.jpg)。
- **洪家关贺龙故居与纪念馆**：故居、纪念馆与纪念空间合并为一次走访，了解桑植地方历史；距核心景区远，预留半日以上。 [资料](https://www.hunan.gov.cn/hnszf/c101486/202108/t20210827_20401993.html)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%9F%AF%E4%BB%B2%E5%B9%B3%E7%BA%AA%E5%BF%B5%E9%A6%86-%E8%B4%BA%E9%BE%99%E9%80%81%E6%9F%AF%E4%BB%B2%E5%B9%B3%E7%9A%84%E5%A4%A7%E8%A1%A3.jpg)。

### 延安

- **延安新闻纪念馆**：从报纸、广播与印刷资料看新闻传播怎样在窑洞条件下运作，适合与清凉山历史相互理解。 [资料](https://yads.org.cn/index.php?a=index&aid=488&c=View&m=home)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E8%A7%A3%E6%94%BE%E6%97%A5%E6%8A%A5%E5%A4%A7%E9%97%A8%E7%9F%B3%E5%88%BB.jpg)。
- **清凉山万佛洞与山城远眺**：沿开放山路看石窟和延河两岸地形，石阶较多；山上游览与山下新闻馆内容不同。 [资料](https://yads.org.cn/index.php?a=index&aid=488&c=View&m=home)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%BB%B6%E5%AE%89%E6%B8%85%E5%87%89%E5%B1%B1.jpg)。
- **鲁艺旧址与延安文艺纪念馆**：把旧址与艺术家资料连起来看，认识《黄河大合唱》等作品产生的时代；教学和展馆区遵从引导。 [资料](https://www.yau.edu.cn/info/1118/33374.htm)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E9%B2%81%E8%BF%85%E8%89%BA%E6%9C%AF%E5%AD%A6%E9%99%A2_2.jpg)。
- **南泥湾大生产记忆与稻田**：将大生产展览与季节稻田结合，区别于付费农家灶台体验；距城区约45公里，接驳另计。 [资料](https://nanniwan.cn/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Nanniwan.jpg)。
- **子长钟山石窟**：在北宋石窟中观察造像群和石刻细节；属于子长方向专程走访，不当作延安市内短停。 [资料](https://zczssk.cn/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Zhongshan_Grottoes.jpg)。
- **黄帝陵与轩辕庙**：在古柏、庙宇与陵区认识祭祀文化；位于黄陵县，完整计算跨县交通，陵庙合为一项。 [资料](https://www.zghdl.com.cn/remains)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Mausoleum_of_the_Yellow_Emperor_(20171001142733).jpg)。
- **延川乾坤湾黄河蛇曲**：从指定观景点看黄河大弯与黄土地形；选择陕西延川侧入口，勿与山西永和侧混淆。 [资料](https://www.wangshangshaanxi.com/newsinfo.asp?big=32&id=888)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E9%BB%84%E6%B2%B3%E4%B9%BE%E5%9D%A4%E6%B9%BE_2.jpg)。
- **圣地河谷金延安**：在当代营造的民俗商业街区看陕北风格建筑和文创，演出按当日节目另选，不描述成原生古镇。 [资料](https://www.yaholyvalley.com/)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Snowfall_on_Yaodong,_Qingjian_County.jpg)。
- **甘谷驿古镇与驿道记忆**：到延安以东的老驿镇看街区、窑洞形态与当地餐饮，商业项目另付费；预留城区往返。 [资料](https://zhuanti.mct.gov.cn/csxz2022/shanxi1/detail_g7yU_730/4449.html)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%A2%81%E5%AE%B6%E6%B2%B3%E7%BA%A2%E8%89%B2%E6%95%99%E8%82%B2_09.jpg)。
- **安塞南沟村果园与乡村生活**：用一段田园时间认识陕北苹果产业，采摘要确认果期与园主接待，避开作业区；购买水果另计。 [资料](https://zhuanti.mct.gov.cn/csxz2022/shanxi1/detail_g7yU_730/4449.html)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E9%99%95%E8%A5%BF%E6%B8%AD%E5%8D%97%E9%80%8F%E5%BF%83%E7%94%9C%E8%8B%B9%E6%9E%9C.jpg)。

### 南昌

- **江西省博物馆新馆**：从青铜、陶瓷与地域历史认识江西；前往红谷滩新馆，预约和临时特展以馆方公告为准。 [资料](https://www.nc.gov.cn/ncszf/jrnc/202503/0a31d729c5ce4b19978b005f7d1c0c1c.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%94%90%E9%9D%92%E9%87%89%E2%80%9C%E8%B4%9E%E5%85%83%E2%80%9D%E9%93%AD%E7%93%B7%E7%89%87.jpg)。
- **南昌瓷板画艺术博物馆**：在丰和南大道520号看瓷上肖像、山水和花鸟，认识烧制与绘画结合的本地非遗；通常周一闭馆，动手课程需另约。 [资料](https://hgt.nc.gov.cn/hgtqrmzf/hgtfm/202604/9ae550b04d86458481e2602661a64306.shtml)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E4%B8%81%E7%AB%8B%E4%B8%AD%EF%BC%881878%EF%BD%9E1958%EF%BC%89_1917%E5%B9%B4%E4%BD%9C_%E8%87%B4%E6%B2%B3%E9%87%8E%E4%B8%B0%E8%97%8F%E8%82%96%E5%83%8F%E7%93%B7%E6%9D%BF%E7%94%BB_%E7%93%B7%E6%9D%BF%3F%E4%B8%80%E4%BB%B6.jpg)。
- **海昏侯国遗址博物馆与考古园**：从金器、简牍与汉代墓葬认识刘贺及列侯生活，馆与遗址合为一次参观，市外交通另留。 [资料](https://www.hhhmuseum.cn/)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%B1%9F%E8%A5%BF%E5%8D%97%E6%98%8C%E6%B5%B7%E6%98%8F%E4%BE%AF%E5%8D%9A%E7%89%A9%E9%A6%86.jpg)。
- **安义古村群**：罗田、水南与京台作为一组古村慢看，认识赣商住宅和农耕文化，不拆成三项重复计数。 [资料](https://anyi.nc.gov.cn/ayxzf/ggwhfw/202510/a728394a1ccb463cbecfa15146dd38ca.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Luotiancun_Village_Anyi_Nanchang_Jiangxi_China_-_panoramio.jpg)。
- **凤凰沟农业与四季花木**：按花期选择茶田、桑园与农业科普区域，春季花景和其他季节体验不同；园内项目另核价。 [资料](https://www.nc.gov.cn/ncszf/ghxx/202203/deaa05156e4842f1ba29076cda8621fe.shtml)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:China_Wuyishan_Tea_Plantation.jpg)。
- **厚田沙地与江岸**：在赣江、锦江附近看风沙地貌与江南水网相遇；不要把宣传中的沙漠理解为无人区，游乐另计。 [资料](https://hgt.nc.gov.cn/hgtqrmzf/lygbds/202512/a0ab9df894d0405bb54fff45b6b3e903.shtml)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Sand_Hills_in_Poyang_Lake.jpg)。
- **汪山土库大宅院**：从院落、天井与家族史料看赣派大宅，留意古建筑的参观动线；郊外往返另计。 [资料](https://www.nc.gov.cn/ncszf/ghxx/202203/deaa05156e4842f1ba29076cda8621fe.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Xinjian_Wangshan_Tuku_20120626-01.jpg)。
- **小平小道陈列馆**：在旧厂房与陈列中认识邓小平在江西劳动生活的经历；展馆与步道合并参观，活动另预约。 [资料](https://www.nc.gov.cn/ncszf/jrnc/202503/0a31d729c5ce4b19978b005f7d1c0c1c.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Nanchang_Xinjian_Deng_Xiaoping_Jiuju_yu_Laodong_Chejian_2018.06.09_14-33-11.jpg)。
- **瑶湖郊野森林公园**：把下午留给湖岸与林地，在开放步道观察城市边缘的水鸟和植物；不进入保育区或野泳。 [资料](https://www.nc.gov.cn/ncszf/ghxx/202203/deaa05156e4842f1ba29076cda8621fe.shtml)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E7%91%B6%E6%B9%96%E9%83%8A%E9%87%8E%E6%A3%AE%E6%9E%97%E5%85%AC%E5%9B%AD_20150121_151433.jpg)。

### 遵义

- **杨粲墓博物馆**：看南宋播州土司墓石刻与人物形象，了解地方历史；先确认墓室和展厅当日开放范围。 [资料](https://www.zunyiol.cn/index.php?a=show&c=index&catid=10&id=139716&m=content)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%9D%A8%E7%B2%B2%E5%A2%9304913.jpg)。
- **娄山关战斗遗址与山口**：把陈列馆、纪念空间与山口步道作为一段完整游览，认识险要地形；区间交通另核对。 [资料](https://zhuanti.mct.gov.cn/xcszbwg2022/guizhou/detail/1972.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%A8%84%E5%B1%B1%E5%85%B3_20140809.jpg)。
- **乌江寨夜游与民俗演艺**：在山水度假区看夜景和排定的民俗节目；这里是当代文旅街区，演出受天气和档期影响。 [资料](https://m.wujiangvillage.com/home)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Xi_jiang_Qianhu_Miao_Village_night_view.jpg)。
- **云门囤天生桥与河谷**：从喀斯特河谷与天生桥理解流水塑造山体，游船是否开行须先确认；位于三渡镇。 [资料](https://you.ctrip.com/sight/zunyi204/140659.html)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Chizhui_river.jpg)。
- **绥阳双河洞游览线**：走景区开放洞穴线路看地下空间，不进入科考或未开发洞段；专业探洞另约，不含在普通参观中。 [资料](https://www.gzqxx.cn/Product.html)；图片范围 `exact-place`。[图片许可页](https://commons.wikimedia.org/wiki/File:Landscape_photos_of_the_developed_area_of_Shuanghe_Cave.jpg)。
- **清溪峡山水游**：到青杠塘镇选择当日开放的游船或峡谷观景，和双河洞是相距较远的独立片区；需另排交通。 [资料](https://www.gzqxx.cn/Product.html)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:Chizhui_river.jpg)。
- **湄潭浙大西迁历史陈列馆**：从西迁办学、师生生活与科研资料认识抗战中的大学，和湄潭茶田体验属于不同主题。 [资料](https://www.gzstv.com/a/d987d2f8490644328a718429e157dfbb)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:1945%E5%B9%B4%E7%A7%8B%E6%B9%84%E6%BD%AD%E6%96%87%E5%BA%99%E6%B5%99%E5%A4%A7%E5%9B%BE%E4%B9%A6%E9%A6%86.png)。
- **茅台中国酒文化城**：看酒器、酿造技术与社会生活的展陈；普通参观不代表进入生产车间，也不承诺购酒资格。 [资料](https://www.mtwhly.com/mtwhly/zyyw/jqjd/index.html)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:Chishui_River_Bank_in_Maotai(Moutai)_Town,_Renhuai_City,_Zunyi,_Guizhou.jpg)。
- **湄潭黔茶记忆与茶工业文化**：通过旧厂与茶业展陈认识制茶从手工走向工业的过程；展陈和体验项目分别预约。 [资料](https://gztmct.com/)；图片范围 `nearby`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E6%B9%84%E6%BD%AD%E4%B8%87%E4%BA%A9%E8%8C%B6%E6%B5%B7_-_panoramio.jpg)。
- **1964文化创意园与三线博物馆**：在长征电器十二厂旧厂房看设备、工业展陈与当期艺术活动；园区与三线博物馆合为一项，展厅及演出时间分别确认。 [资料](https://www.yp.gov.cn/contents/2026/09/03/receive-5094ecdd-f009-4a70-9937-191cbc7d2145.html)；图片范围 `related-theme`。[图片许可页](https://commons.wikimedia.org/wiki/File:%E5%8D%8E%E4%BE%A8%E5%9F%8E%E5%88%9B%E6%84%8F%E5%9B%AD.jpg)。

## 旧体验照片映射

| 体验 ID | 图片 | 范围 | 许可 |
|---|---|---|---|
| ex-beijing-hutong-breakfast | [Douzhir at Laociqikou (20200803141516).jpg](https://commons.wikimedia.org/wiki/File:Douzhir_at_Laociqikou_(20200803141516).jpg) | nearby | CC BY-SA 4.0 |
| ex-tokyo-yae-kimono | [2019-01-14 Kimono Girls at Asakusa, Tokyo on Coming of Age day.jpg](https://commons.wikimedia.org/wiki/File:2019-01-14_Kimono_Girls_at_Asakusa,_Tokyo_on_Coming_of_Age_day.jpg) | nearby | CC BY 2.0 |
| ex-kyoto-canon-tea | [A Japanese Tea Ceremony's Host Preparing Tea - Kyoto, 2023.jpg](https://commons.wikimedia.org/wiki/File:A_Japanese_Tea_Ceremony%27s_Host_Preparing_Tea_-_Kyoto,_2023.jpg) | nearby | CC BY-SA 4.0 |
| ex-osaka-tombori-cruise | [Dotonbori river cruise.JPG](https://commons.wikimedia.org/wiki/File:Dotonbori_river_cruise.JPG) | nearby | CC0 |
| ex-seoul-nanta | [Nanta.jpg](https://commons.wikimedia.org/wiki/File:Nanta.jpg) | related-theme | CC BY-SA 3.0 |
| ex-bangkok-princess-cruise | [Wat Arun At Night (87462663).jpeg](https://commons.wikimedia.org/wiki/File:Wat_Arun_At_Night_(87462663).jpeg) | nearby | CC BY-SA 3.0 |
| ex-bali-discover-diving | [USAT Liberty Wreck Dive.jpg](https://commons.wikimedia.org/wiki/File:USAT_Liberty_Wreck_Dive.jpg) | nearby | CC BY-SA 3.0 |
| ex-dubai-hero-balloon | [Hot air Balloon at Al Quoz4 Dubai.jpg](https://commons.wikimedia.org/wiki/File:Hot_air_Balloon_at_Al_Quoz4_Dubai.jpg) | nearby | CC BY-SA 4.0 |
| ex-chengdu-opera | [Sichuan Opera Face Changer (50427868601).jpg](https://commons.wikimedia.org/wiki/File:Sichuan_Opera_Face_Changer_(50427868601).jpg) | related-theme | CC BY-SA 2.0 |
| ex-xian-tang-dance | [The Tang Dynasty Dinner Show (19192673970).jpg](https://commons.wikimedia.org/wiki/File:The_Tang_Dynasty_Dinner_Show_(19192673970).jpg) | nearby | CC BY 2.0 |
| ex-hangzhou-westlake-show | [杭州 印象西湖 （岳湖. 曲院风荷） - panoramio.jpg](https://commons.wikimedia.org/wiki/File:%E6%9D%AD%E5%B7%9E_%E5%8D%B0%E8%B1%A1%E8%A5%BF%E6%B9%96_%EF%BC%88%E5%B2%B3%E6%B9%96._%E6%9B%B2%E9%99%A2%E9%A3%8E%E8%8D%B7%EF%BC%89_-_panoramio.jpg) | nearby | CC BY 3.0 |
| ex-guangzhou-pearl-cruise | [Pearl River Sightseeing Boat (Guangzhou Red).jpg](https://commons.wikimedia.org/wiki/File:Pearl_River_Sightseeing_Boat_(Guangzhou_Red).jpg) | nearby | CC BY-SA 4.0 |
| ex-chiang-mai-farm-cooking | [Thai-Cooking-Class-Chiang-Mai-Thailand.jpg](https://commons.wikimedia.org/wiki/File:Thai-Cooking-Class-Chiang-Mai-Thailand.jpg) | nearby | CC BY-SA 4.0 |
| ex-aa-ho-chi-minh-city-saigon-princess | [Nighttime boat in the Saigon River.jpg](https://commons.wikimedia.org/wiki/File:Nighttime_boat_in_the_Saigon_River.jpg) | nearby | CC BY 4.0 |
| ex-aa-hoi-an-spice-spoons | [Cooking class, Hoi An (32544686338).jpg](https://commons.wikimedia.org/wiki/File:Cooking_class,_Hoi_An_(32544686338).jpg) | nearby | CC BY-SA 2.0 |
| ex-aa-luang-prabang-tamarind-cooking | [Laos cooking.jpg](https://commons.wikimedia.org/wiki/File:Laos_cooking.jpg) | related-theme | CC BY-SA 2.0 |
| ex-aa-kuala-lumpur-jadi-batek | [Jadi Batek batik workshop, 2023 (01).jpg](https://commons.wikimedia.org/wiki/File:Jadi_Batek_batik_workshop,_2023_(01).jpg) | nearby | CC BY-SA 4.0 |
| ex-aa-langkawi-skytrail | [Langkawi (Gunung Manchinchang).jpg](https://commons.wikimedia.org/wiki/File:Langkawi_(Gunung_Manchinchang).jpg) | nearby | CC BY-SA 4.0 |
| ex-aa-taipei-cookinn | [Xiaolongbao in Taipei.jpg](https://commons.wikimedia.org/wiki/File:Xiaolongbao_in_Taipei.jpg) | nearby | CC BY-SA 4.0 |
| ex-aa-kathmandu-nepal-cooking | [Buff Momo 1.jpg](https://commons.wikimedia.org/wiki/File:Buff_Momo_1.jpg) | related-theme | CC BY-SA 4.0 |
| ex-aa-colombo-colombo-walks | [Pettah Floating Market Colombo, Sri Lanka.jpg](https://commons.wikimedia.org/wiki/File:Pettah_Floating_Market_Colombo,_Sri_Lanka.jpg) | nearby | CC BY-SA 4.0 |
| ex-aa-kandy-lake-club-dance | [Kandyan Dance Kandy Sri Lanka 1.jpg](https://commons.wikimedia.org/wiki/File:Kandyan_Dance_Kandy_Sri_Lanka_1.jpg) | nearby | CC BY-SA 4.0 |
| ex-aa-bangkok-silom-cooking | [May Kaidee's Cooking School P1130092.JPG](https://commons.wikimedia.org/wiki/File:May_Kaidee%27s_Cooking_School_P1130092.JPG) | nearby | CC BY-SA 3.0 |
| ex-aa-bangkok-wat-pho-massage | [Massage Break (21539049).jpeg](https://commons.wikimedia.org/wiki/File:Massage_Break_(21539049).jpeg) | nearby | CC BY-SA 3.0 |
| ex-aa-chiang-mai-asia-scenic | [Thai-Cooking-Class-Chiang-Mai-Thailand.jpg](https://commons.wikimedia.org/wiki/File:Thai-Cooking-Class-Chiang-Mai-Thailand.jpg) | nearby | CC BY-SA 4.0 |
| ex-aa-chiang-mai-jungle-observation | [Elefante en Mae Wang, Chiang Mai.jpg](https://commons.wikimedia.org/wiki/File:Elefante_en_Mae_Wang,_Chiang_Mai.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-tianjin-yangliuqing-print | [杨柳青年画 莲年余利 清 杨柳青年画馆收藏.jpg](https://commons.wikimedia.org/wiki/File:%E6%9D%A8%E6%9F%B3%E9%9D%92%E5%B9%B4%E7%94%BB_%E8%8E%B2%E5%B9%B4%E4%BD%99%E5%88%A9_%E6%B8%85_%E6%9D%A8%E6%9F%B3%E9%9D%92%E5%B9%B4%E7%94%BB%E9%A6%86%E6%94%B6%E8%97%8F.jpg) | nearby | Public domain |
| ex-depth-zunyi-loushan-weaving | [Dongyang Bamboo Weaving Squirrel in Zhejiang Provincial Museum 2014-04.JPG](https://commons.wikimedia.org/wiki/File:Dongyang_Bamboo_Weaving_Squirrel_in_Zhejiang_Provincial_Museum_2014-04.JPG) | related-theme | CC BY-SA 4.0 |
| ex-depth-kyoto-tondaya-home | [Machiya.png](https://commons.wikimedia.org/wiki/File:Machiya.png) | nearby | CC BY 2.5 |
| ex-depth-hiroshima-kagura-evening | [Susanoo-Orochi.jpg](https://commons.wikimedia.org/wiki/File:Susanoo-Orochi.jpg) | related-theme | CC BY-SA 3.0 |
| ex-depth-busan-temple-day | [Interior view of Beomeosa temple with two Buddhist monks in Busan South Korea.jpg](https://commons.wikimedia.org/wiki/File:Interior_view_of_Beomeosa_temple_with_two_Buddhist_monks_in_Busan_South_Korea.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-singapore-intan-peranakan | [Interior of the Peranakan Museum, Singapore 01.jpg](https://commons.wikimedia.org/wiki/File:Interior_of_the_Peranakan_Museum,_Singapore_01.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-bali-celuk-silver | [Gamelan Balls in the making.jpg](https://commons.wikimedia.org/wiki/File:Gamelan_Balls_in_the_making.jpg) | nearby | CC BY 2.0 |
| ex-depth-ho-chi-minh-city-golden-dragon-puppets | [Water-Puppet-Show.jpg](https://commons.wikimedia.org/wiki/File:Water-Puppet-Show.jpg) | related-theme | CC BY-SA 4.0 |
| ex-depth-hoi-an-cam-thanh-basketboat | [Basket Boat and the Bamboo forest (Unsplash).jpg](https://commons.wikimedia.org/wiki/File:Basket_Boat_and_the_Bamboo_forest_(Unsplash).jpg) | nearby | CC0 |
| ex-depth-langkawi-sunset-sailing | [Naga Pelangi, sailing in Langkawi 2010.JPG](https://commons.wikimedia.org/wiki/File:Naga_Pelangi,_sailing_in_Langkawi_2010.JPG) | nearby | CC BY-SA 3.0 |
| ex-depth-cebu-moalboal-sardines | [Sardine run over seafloor in Moalboal 01.jpg](https://commons.wikimedia.org/wiki/File:Sardine_run_over_seafloor_in_Moalboal_01.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-krabi-mangrove-kayak | [Kayaking in Ao Thalane 02.jpg](https://commons.wikimedia.org/wiki/File:Kayaking_in_Ao_Thalane_02.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-ko-lanta-island-thai-cook | [Thai green chicken curry at Highgate Cricket Club, Crouch End, London 1.jpg](https://commons.wikimedia.org/wiki/File:Thai_green_chicken_curry_at_Highgate_Cricket_Club,_Crouch_End,_London_1.jpg) | related-theme | CC BY-SA 4.0 |
| ex-depth-kota-kinabalu-island-snorkel | [Tunku Abdul Rahman National Park.jpg](https://commons.wikimedia.org/wiki/File:Tunku_Abdul_Rahman_National_Park.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-cappadocia-balloon-landscape | [Hot air balloon in Cappadocia 01.jpg](https://commons.wikimedia.org/wiki/File:Hot_air_balloon_in_Cappadocia_01.jpg) | nearby | CC BY-SA 3.0 |
| ex-depth-kathmandu-kirtipur-newari-meal | [Samaybaji.JPG](https://commons.wikimedia.org/wiki/File:Samaybaji.JPG) | related-theme | CC BY-SA 4.0 |
| ex-depth-jaipur-jhalana-wildlife | [Leopard-Jhalana-01.jpg](https://commons.wikimedia.org/wiki/File:Leopard-Jhalana-01.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-chengdu-brocade-encounter | [Chengdu 1991 Shu Brocade Factory Silk Loom (10564660485).jpg](https://commons.wikimedia.org/wiki/File:Chengdu_1991_Shu_Brocade_Factory_Silk_Loom_(10564660485).jpg) | nearby | CC0 |
| ex-depth-haikou-dongzhai-mangrove | [Dongzhai Harbour Mangrove Forest.jpg](https://commons.wikimedia.org/wiki/File:Dongzhai_Harbour_Mangrove_Forest.jpg) | nearby | CC BY-SA 3.0 |
| ex-depth-xiamen-lacquer-thread | [Xiamen gold decorated lacquer plate.JPG](https://commons.wikimedia.org/wiki/File:Xiamen_gold_decorated_lacquer_plate.JPG) | related-theme | CC BY-SA 3.0 |
| ex-depth-guilin-yao-oil-tea | [HK CWB 銅鑼灣 Causeway Bay 維多利亞公園 Victoria Park event 家鄉市集嘉年華 Chinese Folk Cultural Carnival food 恭城油茶 GongCheng Oil Tea June 2024 R12S 02.jpg](https://commons.wikimedia.org/wiki/File:HK_CWB_%E9%8A%85%E9%91%BC%E7%81%A3_Causeway_Bay_%E7%B6%AD%E5%A4%9A%E5%88%A9%E4%BA%9E%E5%85%AC%E5%9C%92_Victoria_Park_event_%E5%AE%B6%E9%84%89%E5%B8%82%E9%9B%86%E5%98%89%E5%B9%B4%E8%8F%AF_Chinese_Folk_Cultural_Carnival_food_%E6%81%AD%E5%9F%8E%E6%B2%B9%E8%8C%B6_GongCheng_Oil_Tea_June_2024_R12S_02.jpg) | related-theme | CC0 |
| ex-depth-luoyang-sancai-workshop | [Tang Dynasty sancai pottery horse.JPG](https://commons.wikimedia.org/wiki/File:Tang_Dynasty_sancai_pottery_horse.JPG) | related-theme | CC BY-SA 4.0 |
| ex-depth-luoyang-peony-festival | [洛阳牡丹.jpg](https://commons.wikimedia.org/wiki/File:%E6%B4%9B%E9%98%B3%E7%89%A1%E4%B8%B9.jpg) | nearby | Public domain |
| ex-depth-quanzhou-marionette-theatre | [泉州花童戲球傀儡戲偶.jpg](https://commons.wikimedia.org/wiki/File:%E6%B3%89%E5%B7%9E%E8%8A%B1%E7%AB%A5%E6%88%B2%E7%90%83%E5%82%80%E5%84%A1%E6%88%B2%E5%81%B6.jpg) | related-theme | CC0 |
| ex-depth-quanzhou-xunpu-flower-crown | [蟳埔女4.jpg](https://commons.wikimedia.org/wiki/File:%E8%9F%B3%E5%9F%94%E5%A5%B34.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-dunhuang-seal-printing | [2018迎新春志愿服务活动 篆刻 03.jpg](https://commons.wikimedia.org/wiki/File:2018%E8%BF%8E%E6%96%B0%E6%98%A5%E5%BF%97%E6%84%BF%E6%9C%8D%E5%8A%A1%E6%B4%BB%E5%8A%A8_%E7%AF%86%E5%88%BB_03.jpg) | related-theme | CC BY-SA 4.0 |
| ex-male-experience-secret-paradise-walk | [Buiobuione Maldive Malé fish market.jpg](https://commons.wikimedia.org/wiki/File:Buiobuione_Maldive_Mal%C3%A9_fish_market.jpg) | nearby | CC BY-SA 4.0 |
| ex-maafushi-experience-kaani-full-day | [Snorkeling in the Indian Ocean in the Maldives..JPG](https://commons.wikimedia.org/wiki/File:Snorkeling_in_the_Indian_Ocean_in_the_Maldives..JPG) | nearby | CC0 |
| ex-cappadocia-experience-royal-balloon | [In the Balloon Basket - Over Goreme - Cappadocia - Turkey (5761037503).jpg](https://commons.wikimedia.org/wiki/File:In_the_Balloon_Basket_-_Over_Goreme_-_Cappadocia_-_Turkey_(5761037503).jpg) | nearby | CC BY-SA 2.0 |
| ex-singapore-ifly | [Recharge for Resiliency takes service members indoor skydiving 150822-F-UN009-030.jpg](https://commons.wikimedia.org/wiki/File:Recharge_for_Resiliency_takes_service_members_indoor_skydiving_150822-F-UN009-030.jpg) | related-theme | Public domain |
| ex-aa-cebu-sidive-discover | [Pacific Clown Anemone Shrimp - Periclimenes brevicarpalis (2048541613).jpg](https://commons.wikimedia.org/wiki/File:Pacific_Clown_Anemone_Shrimp_-_Periclimenes_brevicarpalis_(2048541613).jpg) | nearby | CC BY 2.0 |
| ex-aa-jaipur-skywaltz | [Hot Air Balloon Ride by Sky Waltz.jpg](https://commons.wikimedia.org/wiki/File:Hot_Air_Balloon_Ride_by_Sky_Waltz.jpg) | related-theme | Public domain |
| ex-depth-kuala-lumpur-pewter-workshop | [MY Malaysian pewter KL Royal Selangor Visitor Centre - shop signs Oct-2014.jpg](https://commons.wikimedia.org/wiki/File:MY_Malaysian_pewter_KL_Royal_Selangor_Visitor_Centre_-_shop_signs_Oct-2014.jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-lombok-sukarara-weaving | [Lombok Traditional Hand Weaving.jpg](https://commons.wikimedia.org/wiki/File:Lombok_Traditional_Hand_Weaving.jpg) | nearby | CC BY 3.0 |
| ex-depth-shanghai-era-acrobatics | [Shanghai Circus World, exterior.jpg](https://commons.wikimedia.org/wiki/File:Shanghai_Circus_World,_exterior.jpg) | nearby | CC0 |
| ex-depth-guangzhou-cantonese-opera | [Guangzhou Youth Cantonese Opera Troupe 20130604-A.jpg](https://commons.wikimedia.org/wiki/File:Guangzhou_Youth_Cantonese_Opera_Troupe_20130604-A.jpg) | nearby | CC BY-SA 2.5 |
| ex-depth-lingshui-diaoluo-rainforest | [Sitta solangiae.jpg](https://commons.wikimedia.org/wiki/File:Sitta_solangiae.jpg) | related-theme | CC BY 4.0 |
| ex-depth-dali-zhoucheng-tiedye | [Dali, Yunnan Province, China - 2560935842.jpg](https://commons.wikimedia.org/wiki/File:Dali,_Yunnan_Province,_China_-_2560935842.jpg) | nearby | CC BY-SA 2.0 |
| ex-depth-luoyang-water-banquet | [Mu dan yan cai(牡丹燕菜).jpg](https://commons.wikimedia.org/wiki/File:Mu_dan_yan_cai(%E7%89%A1%E4%B8%B9%E7%87%95%E8%8F%9C).jpg) | nearby | CC BY-SA 4.0 |
| ex-depth-nanjing-yunjin-loom | [南京云锦博物馆.jpg](https://commons.wikimedia.org/wiki/File:%E5%8D%97%E4%BA%AC%E4%BA%91%E9%94%A6%E5%8D%9A%E7%89%A9%E9%A6%86.jpg) | nearby | CC BY-SA 2.0 |
| ex-depth-wuhan-zhiyin-steamer | [Wuhan - Zhonghua Lu Matou - P1050112.JPG](https://commons.wikimedia.org/wiki/File:Wuhan_-_Zhonghua_Lu_Matou_-_P1050112.JPG) | nearby | CC BY-SA 3.0 |
| ex-depth-wuhan-bamboo-summer | [HK 油麻地 Yaumatei Tin Hau Temple 天后古廟 small bamboo chair.JPG](https://commons.wikimedia.org/wiki/File:HK_%E6%B2%B9%E9%BA%BB%E5%9C%B0_Yaumatei_Tin_Hau_Temple_%E5%A4%A9%E5%90%8E%E5%8F%A4%E5%BB%9F_small_bamboo_chair.JPG) | related-theme | CC BY-SA 3.0 |
| ex-depth-shenzhen-shiyan-biodiversity | [Ardea alba & Egretta garzetta, Hong Kong Wetland Park (30832035428).jpg](https://commons.wikimedia.org/wiki/File:Ardea_alba_%26_Egretta_garzetta,_Hong_Kong_Wetland_Park_(30832035428).jpg) | related-theme | CC BY 2.0 |
| ex-depth-zhangjiajie-xiangxi-stage | [Tujia women.jpg](https://commons.wikimedia.org/wiki/File:Tujia_women.jpg) | related-theme | CC BY-SA 2.0 |
| ex-depth-zhangjiajie-tujia-three-pot | [Gan guo vitello 001.png](https://commons.wikimedia.org/wiki/File:Gan_guo_vitello_001.png) | related-theme | CC BY-SA 4.0 |
