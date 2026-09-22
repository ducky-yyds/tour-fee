# 城市成本数据与来源记录

资料核对日期：2026-09-22。数据文件：`data/cities.json`。现覆盖 59 个国家与地区、100 个目的地、821 个景点；其中 45 个官方价格记录、23 个有官方来源支持的免费参观记录，另有 753 个明确标注的估算记录。新增 70 目的地的官方资料与未核价边界见[全球扩展](global-expansion.md)。以下原始表保留最初54条资料，前两次扩展的208条在[扩展记录](expansion.md)逐条列出；景山公园的票价核验也在该文补记。

## 必须保留的价格语义

- `official`：运营机构、政府或官方旅游机构公布的价格。手动资料核对可能来自当前网页或搜索服务保存的官方页面文本，并不代表每一来源均已由本地维护程序直连抓取成功。实际机器抓取状态应以维护程序的日志为准。
- `free`：引用的官方来源明确说明列示范围免费。额外展览、游船、登塔、导览、租赁、购物和餐饮不自动包含。
- `estimate`：供预算使用的编辑假设，未确认当前可成交价格。`checkedAt` 为 null；即使列有官方介绍链接，该链接也不是该金额已经核实的证据。
- `daily` 与 `monthly` 全部是 `editorial-estimate`，不是爬取的酒店、餐厅或房源报价；三个数字对应经济、舒适、高端情景，并非可穷尽的市场最低价和最高价。预算可用于比较目的地，预订前必须按实际日期核价。
- 住宿按每间每晚，月租与水电按每间每月，餐饮、市内交通和杂项按每位成人每天计。月租不包含押金、中介费；杂项不是对签证、保险、购物、医疗、地方住宿税及其他个体费用的全覆盖承诺。
- 票价默认普通成人；外国游客价与本地资格价格存在差异。卢浮宫按非 EEA 居民且非 EEA 公民成人计。东京塔、埃菲尔铁塔等的 low/high 是不同参观产品，并非相同服务的折扣区间。
- 所有价格保留原始币种；圣索菲亚参观区以 EUR 发布，城市其他成本以 TRY 计，因此换算必须使用每条 `price.currency`。
- `priority` 是0—100的编辑推荐排序，不是游客评分、客流或官方评级；`durationRange` 单位为分钟，min/recommended/max表示略览/常规/深入，均为编辑建议并非官方承诺。
- `availability` 仅记录已发现且有来源的临时闭馆区间，必须结合所选日期判断；没有此字段不意味着已核验全部营业日历。高校的零费用不意味着无需预约或可以进入所有校内空间。
- `features`、`category`、`bestTime` 是编辑编写的体验描述；`bestTime` 是建议时段，不是实际开放时间。纬经度为规划近似位置，并非精确入口、导航或交通时刻表。
- 威尼斯等地可能另有按日期或资格收取的城市入城费、住宿税；目前未自动计入，不能将景点步行零门票理解为全程没有额外费用。
- 价格范围并不表示所选日期还有库存；景点时长是编辑安排，不是开放时间。特别假日、闭馆、预约与天气限制仍须在官方页面确认。

## 初始54条中的已核对景点价格

以下记录的 `checkedAt` 均为 2026-09-22。历史政府说明和官方 PDF 已在备注中标注；新的出票页应优先于旧手册。

| 城市 | 景点 | 原币价格 | 官方资料来源 | 适用范围与限制 |
| --- | --- | --- | --- | --- |
| 上海 | 豫园 | 30–40 CNY | [上海豫园](https://www.yugarden.com.cn/page/articleview/message.html) | 成人日场淡季30元、旺季40元；不含夜游、灯会与周边其他收费项目。 |
| 北京 | 故宫博物院 | 40–60 CNY | [故宫博物院](https://intl.dpm.org.cn/visit) | 成人淡季40元、旺季60元；珍宝馆和钟表馆各另收10元，需提前预约。 |
| 北京 | 天坛公园 | 28–34 CNY | [北京市园林绿化局](https://yllhj.beijing.gov.cn/ztxx/kpjd/202312/t20231222_3508034.shtml) | 成人联票淡季28元、旺季34元；仅公园门票10/15元不含主要院落。来源发布于2023年，预订前应复核。 |
| 北京 | 颐和园 | 50–60 CNY | [北京市人民政府](https://english.beijing.gov.cn/specials/parktours/guidevisitors/summerpalace/) | 成人联票淡季50元、旺季60元；不含游船和讲解。 |
| 东京 | 浅草寺与仲见世 | 0 JPY | [东京官方旅游指南 GO TOKYO](https://www.gotokyo.org/en/spot/15/) | 寺院普通参观免费，购物、御守和祈愿服务另付。 |
| 东京 | 明治神宫 | 0 JPY | [明治神宫](https://www.meijijingu.or.jp/en/qa/) | 神宫一般参拜免费；御苑及博物馆另行收费。 |
| 东京 | 东京塔 | 1500–3300 JPY | [东京塔官方售票](https://ticket.tokyotower.co.jp/en/) | 成人主展望台1500日元；Top Deck Tour网上票3300日元起，较高端套餐另计。 |
| 京都 | 清水寺 | 500 JPY | [京都府观光联盟](https://www.kyoto-kankou.or.jp/event/1756) | 官方旅游页面列成人拝观料500日元；成就院等特别参拜另外收费。 |
| 大阪 | 大阪城天守阁 | 1200 JPY | [大阪城天守阁](https://www.osakacastle.net/guide/) | 成人天守阁入场1200日元；不含西之丸庭园等独立收费设施。 |
| 大阪 | 梅田蓝天大厦空中庭园 | 1800–2000 JPY | [梅田蓝天大厦](https://www.skybldg.co.jp/ticketplan/) | 成人官网列预售电子票1800日元、普通价2000日元；限定套餐另计。 |
| 首尔 | 景福宫 | 3000 KRW | [韩国国家遗产厅宫陵遗迹本部](https://royal.cha.go.kr/ROYAL/contents/R703000000.do) | 普通成人日间入场3000韩元；资格优惠及夜间开放安排以官方公告为准。 |
| 曼谷 | 大皇宫与玉佛寺 | 500 THB | [泰国大皇宫](https://www.royalgrandpalace.th/en/buy-ticket) | 外国成人票500泰铢，包含玉佛寺及官方列示的关联场馆；须遵守着装要求。 |
| 曼谷 | 卧佛寺 | 300 THB | [卧佛寺](https://watpho.com/index.php/en/home) | 外国游客入场300泰铢；按摩和课程另收费。 |
| 新加坡 | 滨海湾花园超级树 | 0 SGD | [滨海湾花园](https://www.gardensbythebay.com.sg/en/attractions.html) | 超级树地面花园免费；空中步道、观景台和温室另购门票。 |
| 新加坡 | 新加坡植物园 | 0 SGD | [新加坡国家公园局](https://sbg.nparks.gov.sg/visit/general-info/) | 植物园普通区域免费；国家胡姬花园外国成人标准票另收15新元。 |
| 巴厘岛 | 乌布圣猴森林 | 130000 IDR | [乌布猴林](https://monkeyforestubud.com/visit/) | 官网成人入场130000印尼盾；请勿喂食或触碰猴群。 |
| 巴黎 | 埃菲尔铁塔 | 14.8–36.7 EUR | [埃菲尔铁塔](https://www.toureiffel.paris/en/rates-opening-times) | 成人楼梯至二层14.80欧元、电梯至顶层36.70欧元；不同产品，不含餐饮套餐。 |
| 巴黎 | 卢浮宫 | 32 EUR | [卢浮宫](https://www.louvre.fr/en/visit/hours-admission) | 按非EEA居民且非EEA公民成人标准32欧元；EEA资格票22欧元，未成年人等另有减免。 |
| 伦敦 | 大英博物馆 | 0 GBP | [大英博物馆](https://www.britishmuseum.org/visit) | 常设馆藏免费；建议预约，部分特展和活动收费。 |
| 伦敦 | 英国国家美术馆 | 0 GBP | [英国国家美术馆](https://www.nationalgallery.org.uk/visiting/plan-your-visit) | 一般入场免费，部分特展另收费；可预约免费入场时段。 |
| 伦敦 | 海德公园 | 0 GBP | [英国皇家公园](https://www.royalparks.org.uk/visit/parks) | 公园普通入场免费；游船、收费活动及部分设施另计。 |
| 罗马 | 罗马斗兽场 | 18–24 EUR | [罗马斗兽场考古公园](https://colosseo.it/en/visit/orari-e-biglietti/) | 普通24小时联票18欧元，Full Experience基础票24欧元；不同区域与时效，需预约。 |
| 罗马 | 万神殿 | 7 EUR | [意大利文化部罗马国家博物馆管理局](https://direzionemuseiroma.cultura.gov.it/en/pantheon/) | 普通成人票2026年7月1日起7欧元；特定身份与每月首个周日有减免。 |
| 巴塞罗那 | 圣家堂 | 26–36 EUR | [圣家堂](https://sagradafamilia.org/en/sagrada-familia-ticket) | 普通成人含语音导览26欧元；含塔楼成人票36欧元，须选具体产品和时段。 |
| 巴塞罗那 | 古埃尔公园 | 18 EUR | [古埃尔公园](https://parkguell.barcelona/en/planning-your-visit/prices-and-times) | 普通成人门票18欧元，含增值税；需核对预约时段。 |
| 纽约 | 大都会艺术博物馆 | 30 USD | [大都会艺术博物馆](https://www.metmuseum.org/es/plan-your-visit) | 普通外地成人30美元；学生及部分居民资格有不同费率。 |
| 纽约 | 高线公园 | 0 USD | [高线公园官方导览](https://files.thehighline.org.s3.amazonaws.com/pdf/High_Line_Pocket_Guide.pdf) | 公园免费开放；来源为官方导览手册，临时关闭和活动以官方页面为准。 |
| 悉尼 | 悉尼歌剧院导览 | 50–55 AUD | [悉尼歌剧院](https://www.sydneyoperahouse.com/tours/sydney-opera-house-tour) | 成人预订导览50澳元，当天55澳元；2027年4月起涨为52/57澳元，不含演出。 |
| 悉尼 | 悉尼皇家植物园 | 0 AUD | [悉尼植物园](https://www.botanicgardens.org.au/royal-botanic-garden-sydney/plan-your-visit) | 园区普通入场免费，特别售票活动另计。 |
| 伊斯坦布尔 | 圣索菲亚参观区 | 25 EUR | [土耳其教育部校外学习平台](https://okuldisiogrenme.eba.gov.tr/mekan-detay/ayasofya-cami-2034) | 政府场所资料列外国游客上层参观25欧元；不是另设的历史体验博物馆，里拉现场折算另确认。 |
| 香港 | 香港公园 | 0 HKD | [香港康乐及文化事务署](https://hkp.lcsd.gov.hk/sc/visit) | 公园和列示景观设施免费；体育馆、壁球中心等除外。 |

埃菲尔价格同时核对了 [2026 官方价目表](https://www.toureiffel.paris/fr/tarifs-janv-2026-en)。罗马斗兽场 Full Experience 24 欧元亦见 [官方英文参观规则](https://colosseo.it/sito/wp-content/uploads/2024/11/REGOLAMENTO-COLOSSEO_EN_DEF.pdf)。这两个补充文档不能替代所选日期的实时售票确认。

## 初始54条中的规划估算

这组数值的 `checkedAt` 特意留空。零门票假设仅对应公共空间步行，不代表该地点的所有服务都免费。链接可帮助继续查证，不是“已抓取实价”标签。

| 城市 | 景点 | 编辑预算 | 后续核对入口 | 范围 |
| --- | --- | --- | --- | --- |
| 上海 | 外滩滨江 | 0 CNY | [上海旅游官方指南](https://www.meet-in-shanghai.net/) | 公共滨江步道按零门票规划；游船、观景楼及消费另付，当前开放情况待核验。 |
| 上海 | 上海博物馆东馆 | 0 CNY | [上海博物馆](https://www.shanghaimuseum.cn/mu/frontend/pg/en/service/visit-east) | 仅基本陈列按零门票规划；特展、专项体验另付。官方页已核对入馆指引，尚未抓取明确基本票价字段。 |
| 京都 | 伏见稻荷大社 | 0 JPY | [伏见稻荷大社](https://inari.jp/en/) | 普通参拜按零门票规划；未抓取当前官方票价字段，御守、祈祷及消费另计。 |
| 京都 | 岚山竹林与渡月桥 | 0 JPY | [京都市官方旅游指南](https://kyoto.travel/en/areas/) | 仅公共竹林步道和渡月桥按零门票规划，不含天龙寺、庭园、小火车和人力车。 |
| 大阪 | 道顿堀 | 0 JPY | [大阪官方旅游指南](https://osaka-info.jp/en/) | 公共街区按零门票规划；游船、餐饮和购物另付。 |
| 首尔 | 北村韩屋村 | 0 KRW | [首尔官方旅游指南](https://english.visitseoul.net/attractions/Bukchon%20Hanok%20Village/ENP000261) | 公共街区按零门票规划；尊重居民、遵守限制参观时段，文化体验另付。 |
| 首尔 | 南山公园 | 0 KRW | [首尔官方旅游指南](https://english.visitseoul.net/) | 仅公园徒步按零门票规划；不含缆车、塔内观景台和餐饮。 |
| 曼谷 | 乍都乍周末市场 | 0 THB | [泰国国家旅游局](https://www.tourismthailand.org/) | 仅逛市场按零门票规划；购物和餐饮另付，需核对摊位营业日。 |
| 新加坡 | 鱼尾狮公园 | 0 SGD | [新加坡旅游局](https://www.visitsingapore.com/) | 公共滨水区域按零门票规划；游船和消费另付。 |
| 巴厘岛 | 乌鲁瓦图寺 | 50000–100000 IDR | [印度尼西亚旅游官方指南](https://www.indonesia.travel/) | 寺院入场暂用编辑估算，未核验当前官方票价；不含Kecak舞蹈演出和往返交通。 |
| 巴厘岛 | 海神庙 | 75000–100000 IDR | [印度尼西亚旅游官方指南](https://www.indonesia.travel/) | 编辑估算，未核验当前官方外国游客票价；潮汐影响可到达区域。 |
| 巴黎 | 蒙马特街区 | 0 EUR | [巴黎旅游局](https://parisjetaime.com/eng/) | 公共街区漫步按零门票规划；缆车、博物馆与教堂穹顶另付。 |
| 罗马 | 西班牙阶梯 | 0 EUR | [罗马旅游局](https://www.turismoroma.it/en) | 公共广场步行按零门票规划；餐饮购物另付，遵守现场通行和停留规定。 |
| 巴塞罗那 | 巴塞罗内塔海滩 | 0 EUR | [巴塞罗那旅游局](https://www.barcelonaturisme.com/wv3/en/) | 公共海滩按零门票规划；躺椅、储物柜、运动租赁和餐饮另付。 |
| 纽约 | 中央公园 | 0 USD | [中央公园保护协会](https://www.centralparknyc.org/) | 公共公园按零门票规划；动物园、游船、马车及活动另付。 |
| 悉尼 | 邦迪海滩 | 0 AUD | [悉尼官方旅游网站](https://www.sydney.com/) | 公共海滩按零门票规划；冲浪课、器材与往返交通另计。 |
| 迪拜 | 哈利法塔观景台 | 180–500 AED | [哈利法塔](https://www.burjkhalifa.ae/) | 按不同楼层与时段的规划估算，未取得所选日期即时票价；请跳转官方售票复核。 |
| 迪拜 | 阿法迪历史街区 | 0 AED | [迪拜旅游局](https://www.visitdubai.com/en/places-to-visit/al-fahidi-historical-neighbourhood) | 仅户外街区漫步按零门票规划；馆舍、文化活动和餐饮另计。 |
| 迪拜 | 迪拜码头步道 | 0 AED | [迪拜旅游局](https://www.visitdubai.com/) | 公共步道按零门票规划；游艇、游船和餐饮另计。 |
| 伊斯坦布尔 | 蓝色清真寺 | 0 TRY | [土耳其官方旅游指南](https://istanbul.goturkiye.com/) | 普通参观按零门票规划，未取得当前官方价格字段；祈祷时间可能暂停游客入内。 |
| 伊斯坦布尔 | 大巴扎 | 0 TRY | [土耳其官方旅游指南](https://istanbul.goturkiye.com/) | 仅市场漫步按零门票规划；购物、餐饮与导览另付。 |
| 香港 | 太平山顶与山顶缆车 | 150–220 HKD | [香港山顶官方网站](https://www.thepeak.com.hk/) | 缆车与观景台套餐暂用编辑估算；官网动态票价未成功读取，须按日期复核。 |
| 香港 | 星光大道 | 0 HKD | [香港旅游发展局](https://www.discoverhongkong.com/) | 公共滨水步道按零门票规划；游船和餐饮另付。 |

## 已核对的公共交通参考

以下是可用于后续抓取适配器的具体产品，不能直接当成每个游客全天交通成本。现有 daily.transport 仍为情景估算。

| 城市 | 具体产品 | 2026-09-22 核对价格 | 官方来源 |
| --- | --- | --- | --- |
| 东京 | Tokyo Subway Ticket 成人 24/48/72 小时 | JPY 1000 / 1500 / 2000；东京 Metro 与都营地铁适用，非所有铁路及机场交通通用 | [Tokyo Metro](https://www.tokyometro.jp/en/ticket/travel/index.html) |
| 巴黎 | Metro–Train–RER 单程全价票 | EUR 2.55；有换乘与有效时限规则，机场产品另外购买 | [RATP 2026 票价](https://www.ratp.fr/en/titres-et-tarifs/ticket-metro-train-rer) |
| 迪拜 | nol Silver 单次公共交通 | AED 3 / 5 / 7.5，对应一区、相邻两区、多于两区；卡片本身另计 | [Dubai RTA](https://rta.ae/wps/portal/rta/ae/public-transport/Nol-Fares?lang=en) |

## 本轮核对发现的变动

- 万神殿普通成人票自 2026-07-01 起为 EUR 7；不应继续沿用 EUR 5。[意大利文化部](https://direzionemuseiroma.cultura.gov.it/en/pantheon/)
- 卢浮宫自 2026-01-14 起区分 EEA 与非 EEA 资格，非 EEA 普通成人 EUR 32。[卢浮宫](https://www.louvre.fr/en/visit/hours-admission)
- 上海博物馆东馆与人民广场馆不能混用“免费”标签；人民广场馆美洲古代文明特展期间需要购票。官网正在从 .net 迁往 .cn。[上海博物馆](https://www.shanghaimuseum.cn/mu/frontend/pg/index)
- 乌布猴林当前页面列成人 IDR 130000。[乌布猴林](https://monkeyforestubud.com/visit/)
- 悉尼歌剧院导览成人预订 AUD 50、当天 AUD 55；官网已公布 2027-04 起 AUD 52/57，维护程序应记录生效日期。[悉尼歌剧院](https://www.sydneyoperahouse.com/tours/sydney-opera-house-tour)
- 北村仍是居民区，官方介绍有参观时段限制提示；不能把“免费”理解为全天任意进入。[首尔旅游局](https://english.visitseoul.net/attractions/Bukchon%20Hanok%20Village/ENP000261)

## 图片与进一步数据接入

城市和景点数据内的 image 字段预留本地图片路径；真实文件、作者、许可和来源页以 `data/media.json` 为准，应用应合并该媒体记录。Wikipedia 条目链接只用于地点识别，不能视为摄影作品的授权或署名。

住宿、机票与长期租赁需要能够提供目的地、旅行日期、人数、房型、含税总价、取消条件和更新时间的授权供应商数据。无凭证时，本版本不声称能穷尽平台或市场价格。接入后应保留 provider、productId、currency、unit、fetchedAt、validUntil、税费包含情况和可用性；失败时保留上次成功记录并显示过期状态，不更新“已验证”时间。

建议给固定景点票价及交通适配器设置低频定时抓取和变更告警；对页面结构变化、零价异常或币种变化先保留证据并人工复核。临时演出或限量促销不要覆盖常规成人价。住宿、航班应走授权实时接口，而非将动态展示页面或搜索摘要长期当作可预订库存。
