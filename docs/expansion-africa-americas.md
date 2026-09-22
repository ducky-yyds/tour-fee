# 非洲与美洲目的地扩容 — 2026-09-22

数据文件：`data/expansion/africa-americas.json`。20 个目的地、160 个具体景点；每个目的地 8 个景点、至少 2 项饮食特色和 2 个街区介绍。采用 13 种真实本币：ZAR、MAD、EGP、KES、TZS、SCR、MUR、CAD、MXN、PEN、BRL、ARS、CLP。

## 数据口径与维护边界

- 官方旅游局、政府场馆与目的地资料用于核对目的地和主要景点身份；资料查阅日为 2026-09-22。资料页曾列出某地点，不等于当天已确认正常开放。
- 本次 160 条门票记录均是 `type: estimate`、`checkedAt: null`。部分官方页面含票价，但未完成各国籍、年龄、票种、日期、税费与套餐边界的全面核价，因此统一保留编辑估算。价格来源链接是核价入口，不能当作已经采集该数值的凭证。
- 零门票仅限记录明示的公共区域；餐食、租用设施、特别展区、接送、导游、渡船与个人消费可能另付。船只费用没有冒充免费：多伦多群岛、女人岛、鹿岛等的 `accessNote` 明确往返船费不含。
- 三档日常费用是编辑规划假设：住宿每房每晚，餐饮/交通/杂项每成人每天。月租、水电每房每月。不包含实时酒店房态与日期报价，也不保证外国游客有资格租到相应月租房。
- 经纬度是地点或游客常用区域的规划锚点，不是已核验的停车场、入口或道路导航点。远郊 `accessNote` 的距离为近似量级；城市道路拥堵、地形、海况和运营时段仍会影响实际时间。
- `durationRange` 为人工建议用时，最短适合重点走访，最长适合细看及休息；不保证队列、开放时段和游览许可。自然保护区长距离徒步需单独规划。
- 本次未伪造餐馆、酒店或活动库存记录；新城市首先具备目的地指南、景点与预算基础。
- 图片保留准确条目或已核对 Commons 文件链接，`image.url` 留空交给媒体程序真实下载；未下载成功不编造本地文件名。百科 API 批量核验遇到 HTTP 429，已停止该批检，不声称全部百科标题已通过网络校验。
- 库斯科只保留一个联合旅游票类近郊遗址，避免旧引擎对同一套票重复收费；以后补充 Qenqo / Tambomachay 时应使用同组票 `passGroup`。印加博物馆、十二角石和圣佩德罗市场提供城内替代。
- 国家条目可能返回旗帜：毛里求斯主图明确选择岛内莫纳山条目。坎昆不误用 Cozumel 的同名 Punta Sur 图片；当前改为准确的 Xcaret Park。

## 逐目的地证据与边界

### 开普敦 / Cape Town (`cape-town`)

国家：南非（ZA）；币种 ZAR；门户机场 CPT；查阅日期 2026-09-22。

收录：桌山缆车与山顶、罗本岛、克斯滕博斯国家植物园、开普角与好望角保护区、博尔德斯企鹅海滩、波卡普街区、维多利亚与阿尔弗雷德码头、第六区博物馆。

证据入口：[官方目的地 / 场馆资料](https://www.capetown.travel/heritage-sites-in-cape-town-and-surrounds/)；[补充资料 1](https://www.capetown.travel/top-attractions/tablemountain/)。

估算边界：桌山缆车与罗本岛渡船受风况影响；好望角与博尔德斯海滩属于远郊半岛路线，建议包车或自驾单独安排，不按市中心步行串联。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 约翰内斯堡 / Johannesburg (`johannesburg`)

国家：南非（ZA）；币种 ZAR；门户机场 JNB；查阅日期 2026-09-22。

收录：种族隔离博物馆、宪法山、曼德拉故居博物馆、赫克托·彼得森博物馆、黄金礁城主题公园、约翰内斯堡植物园、沃尔特·西苏鲁国家植物园、金山大学艺术博物馆。

证据入口：[官方目的地 / 场馆资料](https://www.gov.za/about-sa/tourism)；[补充资料 1](https://www.constitutionhill.org.za/explore)。

估算边界：市中心、索韦托与北部花园相距较远，建议可靠出租车、网约车或预约接送；不将跨区直线距离等同适合步行的路线。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 马拉喀什 / Marrakech (`marrakech`)

国家：摩洛哥（MA）；币种 MAD；门户机场 RAK；查阅日期 2026-09-22。

收录：杰马夫纳广场、马约雷勒花园、巴希亚宫、本·优素福神学院、萨阿德王朝陵墓、巴迪宫遗址、库图比亚清真寺外观与花园、梅纳拉花园。

证据入口：[官方目的地 / 场馆资料](https://www.visitmorocco.com/fr/voyage/marrakech)；[补充资料 1](https://www.jardinmajorelle.com/en/)；[补充资料 2](https://e-services.minculture.gov.ma/en/tickets/palais-bahia)。

估算边界：老城部分巷道车辆无法进入；花园和外围酒店需出租车接驳。阿特拉斯山与沙漠不作为市内景点默认插入。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 非斯 / Fes (`fes`)

国家：摩洛哥（MA）；币种 MAD；门户机场 FEZ；查阅日期 2026-09-22。

收录：蓝门、布伊纳尼亚神学院、阿塔里纳神学院、舒阿拉皮革染坊观景区、奈加因木艺博物馆、杰南·斯比尔花园、非斯王宫铜门外观、马林王朝陵墓遗址。

证据入口：[官方目的地 / 场馆资料](https://www.visitmorocco.com/en/travel/fez/medina)；[补充资料 1](https://www.visitmorocco.com/sites/default/files/atoms/files/Fes%20FR.pdf)。

估算边界：麦地那大部分道路只能步行，酒店可能需在城门接行李；旧城坡道和台阶较多，地图距离不能代表步行耗时。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 开罗 / Cairo (`cairo`)

国家：埃及（EG）；币种 EGP；门户机场 CAI；查阅日期 2026-09-22。

收录：吉萨金字塔群、大埃及博物馆、解放广场埃及博物馆、萨拉丁城堡、汗·哈利利市场、埃及文明国家博物馆、萨卡拉阶梯金字塔遗址、科普特博物馆。

证据入口：[官方目的地 / 场馆资料](https://www.experienceegypt.eg/en/City/1/cairo-giza)；[补充资料 1](https://www.experienceegypt.eg/en/attraction-details/346/the-grand-egyptian-museum-gem)；[补充资料 2](https://www.experienceegypt.eg/en/attraction-details/292/historic-cairo)。

估算边界：开罗道路拥堵显著；吉萨、萨卡拉与中心城区需要单独车程。金字塔门票一般不等于所有墓室、车辆、向导或骑乘费用。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 卢克索 / Luxor (`luxor`)

国家：埃及（EG）；币种 EGP；门户机场 LXR；查阅日期 2026-09-22。

收录：卡尔纳克神庙、卢克索神庙、帝王谷、哈特谢普苏特女王神庙、麦迪奈哈布神庙、门农巨像、卢克索博物馆、王后谷。

证据入口：[官方目的地 / 场馆资料](https://www.experienceegypt.eg/en/city/22/luxor)；[补充资料 1](https://www.experienceegypt.eg/files/Luxor-Eng.pdf)。

估算边界：尼罗河东西岸跨河需渡船或绕桥车程，不能按河面直线当步行；西岸景点彼此分散，建议预约车辆。高温会明显增加休息时间。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 内罗毕 / Nairobi (`nairobi`)

国家：肯尼亚（KE）；币种 KES；门户机场 NBO；查阅日期 2026-09-22。

收录：内罗毕国家公园、长颈鹿中心、卡伦·布里克森博物馆、内罗毕国家博物馆、卡鲁拉森林、内罗毕铁路博物馆、谢尔德里克野生动物信托参访、乌胡鲁花园纪念地。

证据入口：[官方目的地 / 场馆资料](https://tic.magicalkenya.com/)；[补充资料 1](https://tic.magicalkenya.com/listing/giraffe-centre/)；[补充资料 2](https://magicalkenya.com/wp-content/uploads/2025/01/A-Reason-for-Safari-Calender-Final.pdf)。

估算边界：道路拥堵和公园入口等待需留余量；国家公园票不含游猎车辆、司机与接送。郊区保护中心需预约并遵守各自访问时段。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 桑给巴尔 / Zanzibar (`zanzibar`)

国家：坦桑尼亚（TZ）；币种 TZS；门户机场 ZNZ；查阅日期 2026-09-22。

收录：石头城历史街区、桑给巴尔古堡、福罗达尼花园、基督教堂与旧奴隶市场纪念地、乔扎尼森林、昌古岛（监狱岛）、南威海滩、马鲁胡比宫殿遗址。

证据入口：[官方目的地 / 场馆资料](https://www.zanzibartourism.go.tz/)；[补充资料 1](https://www.zanzibartourism.go.tz/)。

估算边界：岛内公路交通与跨海船程分别安排；石头城到 Nungwi 约 60 公里。离岛不能以陆路速度计算，海况、潮汐及当地强制保险/税费需另查。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 塞舌尔马埃岛 / Mahé (`mahe`)

国家：塞舌尔（SC）；币种 SCR；门户机场 SEZ；查阅日期 2026-09-22。

收录：博瓦隆海滩、塞舌尔国家植物园、维多利亚钟楼、传教士遗址观景点、塞舌尔山国家公园、昂斯因当斯海滩、圣安妮海洋国家公园、塔卡马卡海滩。

证据入口：[官方目的地 / 场馆资料](https://www.seychelles.com/blog-details/13554/highlights/seychelles-districts-complete-guide-visitors-and-locals)；[补充资料 1](https://admin.seychelles.com/sites/default/files/2024-02/Map%20of%20Mahe.pdf)。

估算边界：山路弯道多，公交行李限制与班次应单独核实；海洋公园需船只接驳。普拉兰岛、拉迪格岛不按马埃岛市内路线计算。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 毛里求斯 / Mauritius (`mauritius`)

国家：毛里求斯（MU）；币种 MUR；门户机场 MRU；查阅日期 2026-09-22。

收录：庞普勒穆斯植物园、夏马雷七色土与瀑布观景区、黑河峡谷国家公园、莫纳山文化景观、阿普拉瓦西·加特移民遗址、高丹海滨广场、鹿岛、圣水湖。

证据入口：[官方目的地 / 场馆资料](https://mauritiusnow.com/mauritius-map/west-mauritius/)；[补充资料 1](https://mauritiusnow.com/blog/things-to-do/waterfalls-in-mauritius/)。

估算边界：岛内景点分散，宜租车或包车按区域游览；东岸离岛需船接，所谓水下瀑布为海岸光学景观，空中观光费用不包含。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 温哥华 / Vancouver (`vancouver`)

国家：加拿大（CA）；币种 CAD；门户机场 YVR；查阅日期 2026-09-22。

收录：斯坦利公园、格兰维尔岛公共市场、卡皮拉诺吊桥公园、格劳斯山、盖斯镇蒸汽钟街区、英属哥伦比亚大学人类学博物馆、伊丽莎白女王公园、温哥华美术馆。

证据入口：[官方目的地 / 场馆资料](https://www.destinationvancouver.com/inspirations/city/10-must-see-attractions)；[补充资料 1](https://www.destinationvancouver.com/things-to-do/stanley-park)。

估算边界：北岸吊桥与格劳斯山需跨桥接驳，不能按市中心步行速度计算；山顶缆车、步道和雪季活动受天气影响。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 多伦多 / Toronto (`toronto`)

国家：加拿大（CA）；币种 CAD；门户机场 YYZ；查阅日期 2026-09-22。

收录：加拿大国家电视塔、皇家安大略博物馆、加拿大里普利水族馆、圣劳伦斯市场、古酿酒厂区、卡萨罗马城堡、安大略美术馆、多伦多群岛中央岛。

证据入口：[官方目的地 / 场馆资料](https://www.destinationtoronto.com/things-to-do/attractions/must-see-attractions/)；[补充资料 1](https://www.destinationtoronto.com/plan-your-trip/trip-ideas-and-itineraries/iconic-toronto/)。

估算边界：湖心岛渡船需候船及天气余量；皮尔逊机场、市内景点与尼亚加拉方向是不同交通尺度，城际活动应单独规划。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 魁北克城 / Québec City (`quebec-city`)

国家：加拿大（CA）；币种 CAD；门户机场 YQB；查阅日期 2026-09-22。

收录：魁北克老城、达弗林平台、小香普兰街区、魁北克城堡、亚伯拉罕平原、文明博物馆、蒙莫朗西瀑布公园、魁北克圣母圣殿主教座堂。

证据入口：[官方目的地 / 场馆资料](https://www.quebec-cite.com/en/what-to-do-quebec-city/must-see-attractions)；[补充资料 1](https://www.quebec-cite.com/sites/otq/files/media/document/Magazine_ete_2024.pdf)。

估算边界：上下城坡道与台阶较多，缆车单独收费；蒙莫朗西瀑布距老城约 12 公里，冬季路况需留余量。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 墨西哥城 / Mexico City (`mexico-city`)

国家：墨西哥（MX）；币种 MXN；门户机场 MEX；查阅日期 2026-09-22。

收录：宪法广场与历史中心、国家人类学博物馆、查普尔特佩克城堡、美术宫、弗里达·卡罗博物馆（蓝屋）、大神庙博物馆与遗址、特奥蒂瓦坎考古遗址、索玛雅博物馆。

证据入口：[官方目的地 / 场馆资料](https://mexicocity.cdmx.gob.mx/category/chapultepec-imperdibles/)；[补充资料 1](https://www.mexicocity.cdmx.gob.mx/venues/bosque-de-chapultepec/)。

估算边界：路面拥堵与高海拔会影响节奏；特奥蒂瓦坎距中心约 50 公里，需另计往返公路时间。预约博物馆应围绕实际时段排程。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 坎昆 / Cancún (`cancun`)

国家：墨西哥（MX）；币种 MXN；门户机场 CUN；查阅日期 2026-09-22。

收录：海豚海滩、埃尔雷考古遗址、坎昆玛雅博物馆与圣米格利托、埃尔梅科考古遗址、女人岛北海滩、西卡莱特生态文化公园、图卢姆考古遗址、奇琴伊察。

证据入口：[官方目的地 / 场馆资料](https://lugares.inah.gob.mx/es/node/4404)；[补充资料 1](https://lugares.inah.gob.mx/images/publicaciones/los_mayas_de_el_meco.pdf)；[补充资料 2](https://www.xcaret.com/en/faqs/xcaret/)。

估算边界：酒店区公路狭长，跨区容易耗时；女人岛需渡船，图卢姆约 130 公里、奇琴伊察约 200 公里公路距离，建议分日或异地过夜。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 利马 / Lima (`lima`)

国家：秘鲁（PE）；币种 PEN；门户机场 LIM；查阅日期 2026-09-22。

收录：利马武器广场、拉尔科博物馆、普克亚纳遗址、巴兰科叹息桥街区、米拉弗洛雷斯海滨步道、圣弗朗西斯科修道院、神奇水路公园、帕查卡马克考古遗址。

证据入口：[官方目的地 / 场馆资料](https://www.peru.travel/destinations/lima)；[补充资料 1](https://www.peru.travel/attractions/historic-center-of-lima)。

估算边界：机场到市内及跨区交通受拥堵影响大；帕查卡马克位于南部远郊，需留出独立车程，海岸悬崖上下不可按平面直线步行。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 库斯科 / Cusco (`cusco`)

国家：秘鲁（PE）；币种 PEN；门户机场 CUZ；查阅日期 2026-09-22。

收录：库斯科武器广场、太阳神殿科里坎查、萨克塞瓦曼、库斯科主教座堂、圣布拉斯街区、圣佩德罗市场、印加博物馆、十二角石。

证据入口：[官方目的地 / 场馆资料](https://www.peru.travel/es/atractivos/centro-historico-de-cusco)；[补充资料 1](https://www.peru.travel/es/destinos/cusco)；[补充资料 2](https://www.peru.travel/es/inspirate/7-cosas-gratis-que-puedes-hacer-en-la-ciudad-de-cusco)。

估算边界：高海拔与坡道会增加实际耗时；圣谷和马丘比丘不能按城市普通交通插入。部分近郊遗址实行联合旅游票，选多处时需按套票核价避免重复。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 里约热内卢 / Rio de Janeiro (`rio-de-janeiro`)

国家：巴西（BR）；币种 BRL；门户机场 GIG；查阅日期 2026-09-22。

收录：基督救世主像、糖面包山缆车、科帕卡巴纳海滩、伊帕内玛海滩、里约植物园、塞拉隆阶梯、明日博物馆、马拉卡纳球场参观。

证据入口：[官方目的地 / 场馆资料](https://riotur.rio/en/que_fazer/rio-highlights/)；[补充资料 1](https://riotur.rio/en/que_fazer/rio-beaches/)。

估算边界：山地景点需指定列车、接驳车或缆车；堵车及天气会影响用时。海滩之间可沿成熟步道移动，跨山路线不按直线步行计算。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 布宜诺斯艾利斯 / Buenos Aires (`buenos-aires`)

国家：阿根廷（AR）；币种 ARS；门户机场 EZE；查阅日期 2026-09-22。

收录：科隆剧院、雷科莱塔公墓、卡米尼托彩色街、五月广场与玫瑰宫外观、雅典人书店、拉丁美洲艺术博物馆、女人桥与马德罗港、巴勒莫玫瑰园。

证据入口：[官方目的地 / 场馆资料](https://turismo.buenosaires.gob.ar/en/recorrido/must-see-attractions)；[补充资料 1](https://turismo.buenosaires.gob.ar/es/recorrido/imperdibles)。

估算边界：价格和汇率波动可能较大，全部 ARS 区间仅作编辑规划；EZE 机场在远郊。La Boca、雷科莱塔与巴勒莫跨区需公交、地铁或可靠车辆。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。

### 圣地亚哥 / Santiago (`santiago`)

国家：智利（CL）；币种 CLP；门户机场 SCL；查阅日期 2026-09-22。

收录：圣克里斯托瓦尔山、圣露西亚山、圣地亚哥武器广场、智利前哥伦布艺术博物馆、拉莫内达宫文化中心、Sky Costanera 观景台、记忆与人权博物馆、拉斯塔里亚街区。

证据入口：[官方目的地 / 场馆资料](https://chile.travel/destinos/santiago-capital/)；[补充资料 1](https://chile.travel/en/attractions/cerro-san-cristobal/)。

估算边界：山丘缆车与步道速度不同，空气能见度影响山景；机场、酒庄和安第斯山谷需公路接驳，不能按城市普通交通自动串联。 所列票价为未核验的编辑区间，日常和月租费用同样为假设。


## 校验

JSON 可解析；20 个城市 ID、160 个景点 ID 互不重复；每个城市至少 8 个景点；价格币种与所在城市一致；160 条价格记录保留估算标识和空票价核验日期；建议用时在最短与最长值之间。已为所有城市提供官方核价入口、交通说明、饮食和街区指南。
