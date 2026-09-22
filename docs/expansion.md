# 城市与景点扩展记录

最新覆盖：59 个国家与地区、100 个目的地、821 个景点，详见[全球扩展](global-expansion.md)。北京42景点，上海、西安、成都、杭州、广州、东京、京都、巴黎、伦敦各12景点。以下保留前两轮阶段记录和字段规则，不宣称完整覆盖某城市或世界所有景点。

第一轮（2026-09-22）：`data/cities.json` 从18城54景点扩展到30城168景点；保留原城市及原景点ID。原18城各6景点，新增12城各5景点。全部168景点均含独立描述、3条体验亮点、分类、建议时段、建议游览时长和近似坐标。

新增城市：成都、西安、杭州、广州、里斯本、阿姆斯特丹、柏林、威尼斯、佛罗伦萨、洛杉矶、墨尔本、清迈。新增币种仅使用应用已有的CNY、EUR、USD、AUD、THB。

## 资料边界

- 全部30城住宿、餐饮、交通、杂费和月租仍是明确标记的编辑情景估算；不是抓取的具体日期可订库存，也不是数学上的全市场最低价/最高价。
- 新增114条中21条有本轮核对的官方价格或免费范围依据，其余93条为估算，`checkedAt:null`。全库共35条官方收费价、17条有官方依据的免费记录、116条估算。
- 核价通过运营方、政府及官方机构公开页面或搜索服务保存的页面文本完成；不宣称每个来源已经进入定时自动采集器。自动采集结果须以对应采集日志为准。
- 零元且type=estimate表示指定公共区域步行的预算假设，未验证当前规则；不能显示为已核验免费。免费园区与博物馆记录都保留收费特展、停车、船票或活动的范围限制。
- `bestTime` 仅为编辑游玩建议。预约库存、闭馆日、特别活动和天气未实时验证。安妮之家、国会穹顶等可能在特定日期关闭。
- 城市坐标及景点坐标用于大致地理排序；跨岛、山路、渡轮、通勤和跨城交通不能仅按直线距离理解。
- 景点的交通、附加票种、餐饮购物及住宿税、可能的城市入城费需另外核对；日常交通预算也不代表自动包含每个远郊 excursion 的实际花费。
- 图片实际作者、许可、来源页和本地文件由 `data/media.json` 管理；数据中英文Wikipedia条目仅用于地点身份匹配。

## 本轮核对的关键变化

- 灵隐寺与飞来峰已按2025年12月1日起的免票预约政策设为0元，并保留实名分时预约提示；证据是杭州政协网站转载景区通知。不能继续用旧的飞来峰45元加寺院30元预算。
- 二条城将入城800日元与二之丸、预约本丸、收藏馆的产品范围拆开说明，综合上限2400日元为所列常规项目相加。
- 里斯本海洋馆成人票按入馆时段25/27/29欧元；乌菲兹普通成人当天25欧元、提前购买29欧元；这都是产品或渠道差异。
- 盖蒂中心、格里菲斯天文台、NGV与植物园的免费范围都不包含停车或额外收费节目。

## 新增景点逐条记录

下表的“已核对”指2026-09-22核对资料；“估算”不代表链接支持列示金额。票价默认普通成人，具体适用范围以备注为准。

| 城市 | 景点 ID / 名称 | 原币预算 | 状态 | 资料入口 | 适用范围 |
| --- | --- | --- | --- | --- | --- |
| 上海 | shanghai-tower / 上海中心观光厅 | 180–300 CNY | 估算 / 待核验 | [上海官方旅游指南](https://www.meet-in-shanghai.net/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 上海 | tianzifang / 田子坊 | 0 CNY | 估算 / 待核验 | [上海官方旅游指南](https://www.meet-in-shanghai.net/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 上海 | zhujiajiao / 朱家角古镇 | 0–100 CNY | 估算 / 待核验 | [上海官方旅游指南](https://www.meet-in-shanghai.net/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 北京 | mutianyu / 慕田峪长城 | 40–200 CNY | 估算 / 待核验 | [北京市人民政府](https://english.beijing.gov.cn/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 北京 | jingshan-park / 景山公园 | 2–10 CNY | 估算 / 待核验 | [北京市人民政府](https://english.beijing.gov.cn/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 北京 | lama-temple / 雍和宫 | 25–40 CNY | 估算 / 待核验 | [北京市人民政府](https://english.beijing.gov.cn/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 东京 | ueno-park / 上野公园 | 0 JPY | 估算 / 待核验 | [东京官方旅游指南](https://www.gotokyo.org/en/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 东京 | shinjuku-gyoen / 新宿御苑 | 500 JPY | 已核对收费价 | [日本环境省新宿御苑](https://policies.env.go.jp/national-garden/shinjukugyoen/english/guide/information/) | 成人常规门票；特殊日期预约安排以官网为准。 |
| 东京 | shibuya-crossing / 涩谷十字路口 | 0 JPY | 估算 / 待核验 | [东京官方旅游指南](https://www.gotokyo.org/en/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 京都 | kinkakuji / 金阁寺 | 500 JPY | 已核对收费价 | [相国寺派金阁寺](https://www.shokoku-ji.jp/en/kinkakuji/access/) | 普通成人参拜500日元；特别参拜可能不同。 |
| 京都 | nijo-castle / 二条城 | 800–2400 JPY | 已核对收费价 | [京都市二条城](https://nijo-jocastle.city.kyoto.lg.jp/admission/fee/) | 成人入城800；含二之丸1300；另加本丸1000及收藏馆100合计2400；本丸须预约。 |
| 京都 | gion / 祇园街区 | 0 JPY | 估算 / 待核验 | [京都市官方旅游指南](https://kyoto.travel/en/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 大阪 | kuromon-market / 黑门市场 | 0 JPY | 估算 / 待核验 | [大阪官方旅游指南](https://osaka-info.jp/en/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 大阪 | shitennoji / 四天王寺 | 300–800 JPY | 估算 / 待核验 | [大阪官方旅游指南](https://osaka-info.jp/en/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 大阪 | sumiyoshi-taisha / 住吉大社 | 0 JPY | 估算 / 待核验 | [大阪官方旅游指南](https://osaka-info.jp/en/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 首尔 | changdeokgung / 昌德宫 | 3000–8000 KRW | 估算 / 待核验 | [首尔官方旅游指南](https://english.visitseoul.net/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 首尔 | cheonggyecheon / 清溪川 | 0 KRW | 估算 / 待核验 | [首尔官方旅游指南](https://english.visitseoul.net/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 首尔 | dongdaemun-design-plaza / 东大门设计广场 | 0–30000 KRW | 估算 / 待核验 | [首尔官方旅游指南](https://english.visitseoul.net/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 曼谷 | wat-arun / 郑王庙 | 100–200 THB | 估算 / 待核验 | [泰国国家旅游局](https://www.tourismthailand.org/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 曼谷 | jim-thompson-house / 吉姆汤普森故居 | 250 THB | 已核对收费价 | [吉姆汤普森之家博物馆](https://jimthompsonhouse.org/) | 普通成人入场250泰铢；主屋参观须随馆方导览。 |
| 曼谷 | lumpini-park / 伦披尼公园 | 0 THB | 估算 / 待核验 | [泰国国家旅游局](https://www.tourismthailand.org/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 新加坡 | national-gallery-singapore / 新加坡国家美术馆 | 20–30 SGD | 已核对收费价 | [新加坡国家美术馆](https://www.nationalgallery.sg/sg/en/visit/visitor-information.html) | 非新加坡公民/永久居民普通成人基础门票20新元、All Access30新元；资格优惠另查。 |
| 新加坡 | siloso-beach / 圣淘沙西乐索海滩 | 0 SGD | 估算 / 待核验 | [新加坡旅游局](https://www.visitsingapore.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 新加坡 | chinatown-singapore / 牛车水 | 0 SGD | 估算 / 待核验 | [新加坡旅游局](https://www.visitsingapore.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 巴厘岛 | tegallalang / 德格拉朗梯田 | 25000–100000 IDR | 估算 / 待核验 | [印度尼西亚旅游官方指南](https://www.indonesia.travel/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 巴厘岛 | jatiluwih / 贾蒂鲁维梯田 | 50000–100000 IDR | 估算 / 待核验 | [印度尼西亚旅游官方指南](https://www.indonesia.travel/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 巴厘岛 | tirta-empul / 圣泉寺 | 50000–100000 IDR | 估算 / 待核验 | [印度尼西亚旅游官方指南](https://www.indonesia.travel/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 巴黎 | musee-orsay / 奥赛博物馆 | 14–16 EUR | 已核对收费价 | [奥赛博物馆](https://www.musee-orsay.fr/fr/visite/tarifs) | 普通成人现场14欧元、线上16欧元；特定夜场及资格优惠另查。 |
| 巴黎 | arc-de-triomphe / 凯旋门 | 16–22 EUR | 估算 / 待核验 | [巴黎旅游局](https://parisjetaime.com/eng/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 巴黎 | luxembourg-gardens / 卢森堡公园 | 0 EUR | 估算 / 待核验 | [巴黎旅游局](https://parisjetaime.com/eng/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 伦敦 | tower-of-london / 伦敦塔 | 35–45 GBP | 估算 / 待核验 | [伦敦官方旅游指南](https://www.visitlondon.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 伦敦 | tate-modern / 泰特现代美术馆 | 0 GBP | 估算 / 待核验 | [伦敦官方旅游指南](https://www.visitlondon.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 伦敦 | borough-market / 博罗市场 | 0 GBP | 估算 / 待核验 | [伦敦官方旅游指南](https://www.visitlondon.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 罗马 | piazza-navona / 纳沃纳广场 | 0 EUR | 估算 / 待核验 | [罗马旅游局](https://www.turismoroma.it/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 罗马 | castel-santangelo / 圣天使堡 | 16–25 EUR | 估算 / 待核验 | [罗马旅游局](https://www.turismoroma.it/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 罗马 | villa-borghese / 博尔盖塞公园 | 0 EUR | 估算 / 待核验 | [罗马旅游局](https://www.turismoroma.it/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 巴塞罗那 | casa-batllo / 巴特罗之家 | 30–65 EUR | 估算 / 待核验 | [巴塞罗那旅游局](https://www.barcelonaturisme.com/wv3/en/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 巴塞罗那 | gothic-quarter / 哥特区 | 0 EUR | 估算 / 待核验 | [巴塞罗那旅游局](https://www.barcelonaturisme.com/wv3/en/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 巴塞罗那 | montjuic / 蒙锥克山 | 0 EUR | 估算 / 待核验 | [巴塞罗那旅游局](https://www.barcelonaturisme.com/wv3/en/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 纽约 | statue-of-liberty / 自由女神像与埃利斯岛 | 25–40 USD | 估算 / 待核验 | [纽约官方旅游指南](https://www.nyctourism.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 纽约 | brooklyn-bridge / 布鲁克林大桥 | 0 USD | 估算 / 待核验 | [纽约官方旅游指南](https://www.nyctourism.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 纽约 | moma / 纽约现代艺术博物馆 | 30 USD | 已核对收费价 | [纽约现代艺术博物馆](https://www.moma.org/visit/) | 普通成人门票30美元，含馆内展厅和特别展览；资格优惠另查。 |
| 悉尼 | manly-beach / 曼利海滩 | 0 AUD | 估算 / 待核验 | [悉尼官方旅游网站](https://www.sydney.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 悉尼 | art-gallery-nsw / 新南威尔士州美术馆 | 0 AUD | 已核对免费范围 | [新南威尔士州政府](https://www.nsw.gov.au/visiting-and-exploring-nsw/locations-and-attractions/art-gallery-of-new-south-wales) | 美术馆普通入场免费；部分特别展览另收门票。 |
| 悉尼 | taronga-zoo / 塔龙加动物园 | 45–65 AUD | 估算 / 待核验 | [悉尼官方旅游网站](https://www.sydney.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 迪拜 | museum-of-future / 未来博物馆 | 150–200 AED | 估算 / 待核验 | [迪拜旅游局](https://www.visitdubai.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 迪拜 | dubai-frame / 迪拜相框 | 50–70 AED | 估算 / 待核验 | [迪拜旅游局](https://www.visitdubai.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 迪拜 | jumeirah-beach / 朱美拉公共海滩 | 0 AED | 估算 / 待核验 | [迪拜旅游局](https://www.visitdubai.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 伊斯坦布尔 | topkapi-palace / 托普卡帕宫 | 2500–4000 TRY | 估算 / 待核验 | [土耳其官方旅游指南](https://istanbul.goturkiye.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 伊斯坦布尔 | basilica-cistern / 地下水宫 | 1000–1800 TRY | 估算 / 待核验 | [土耳其官方旅游指南](https://istanbul.goturkiye.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 伊斯坦布尔 | galata-tower / 加拉塔塔 | 25–35 EUR | 估算 / 待核验 | [土耳其官方旅游指南](https://istanbul.goturkiye.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 香港 | tian-tan-buddha / 天坛大佛与宝莲禅寺 | 0 HKD | 估算 / 待核验 | [香港旅游发展局](https://www.discoverhongkong.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 香港 | ngong-ping-360 / 昂坪360缆车 | 200–400 HKD | 估算 / 待核验 | [香港旅游发展局](https://www.discoverhongkong.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 香港 | temple-street / 庙街 | 0 HKD | 估算 / 待核验 | [香港旅游发展局](https://www.discoverhongkong.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 成都 | chengdu-panda-base / 成都大熊猫繁育研究基地 | 55 CNY | 已核对收费价 | [成都大熊猫繁育研究基地](https://www.panda.org.cn/en/service/ticket/) | 成人普通门票；分时预约，园内交通和讲解另计。 |
| 成都 | wuhou-shrine / 武侯祠 | 50–60 CNY | 估算 / 待核验 | [成都官方城市指南](https://www.gochengdu.cn/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 成都 | jinli / 锦里 | 0 CNY | 估算 / 待核验 | [成都官方城市指南](https://www.gochengdu.cn/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 成都 | dufu-cottage / 杜甫草堂 | 50–60 CNY | 估算 / 待核验 | [成都官方城市指南](https://www.gochengdu.cn/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 成都 | kuanzhai-alley / 宽窄巷子 | 0 CNY | 估算 / 待核验 | [成都官方城市指南](https://www.gochengdu.cn/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 西安 | terracotta-army / 秦始皇兵马俑 | 120 CNY | 已核对收费价 | [秦始皇帝陵博物院](https://www.bmy.com.cn/jingtai/bmyweb/ticketing.html) | 成人门票，包含兵马俑与丽山园；交通、讲解另计。 |
| 西安 | xian-city-wall / 西安城墙 | 54–80 CNY | 估算 / 待核验 | [陕西省人民政府旅游资料](https://en.shaanxi.gov.cn/tourism/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 西安 | giant-wild-goose-pagoda / 大雁塔与大慈恩寺 | 40–70 CNY | 估算 / 待核验 | [陕西省人民政府旅游资料](https://en.shaanxi.gov.cn/tourism/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 西安 | shaanxi-history-museum / 陕西历史博物馆 | 0 CNY | 估算 / 待核验 | [陕西省人民政府旅游资料](https://en.shaanxi.gov.cn/tourism/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 西安 | xian-muslim-quarter / 回民街区 | 0 CNY | 估算 / 待核验 | [陕西省人民政府旅游资料](https://en.shaanxi.gov.cn/tourism/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 杭州 | west-lake / 西湖 | 0 CNY | 估算 / 待核验 | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 杭州 | lingyin-temple / 灵隐寺与飞来峰 | 0 CNY | 已核对免费范围 | [杭州政协网转载景区免票通知](https://www.hzzx.gov.cn/content/2025-11/20/content_9127920.htm) | 政府网站转载2025年12月1日起景区含灵隐寺免票政策；须实名分时预约，当前规则请核对。 |
| 杭州 | xixi-wetland / 西溪湿地 | 60–140 CNY | 估算 / 待核验 | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 杭州 | longjing-village / 龙井村 | 0 CNY | 估算 / 待核验 | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 杭州 | hefang-street / 河坊街 | 0 CNY | 估算 / 待核验 | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 广州 | canton-tower / 广州塔 | 150–398 CNY | 估算 / 待核验 | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 广州 | chen-clan-academy / 陈家祠 | 10–20 CNY | 估算 / 待核验 | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 广州 | shamian-island / 沙面 | 0 CNY | 估算 / 待核验 | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 广州 | yuexiu-park / 越秀公园 | 0 CNY | 估算 / 待核验 | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 广州 | baiyun-mountain / 白云山 | 5–30 CNY | 估算 / 待核验 | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 里斯本 | belem-tower / 贝伦塔 | 10–20 EUR | 估算 / 待核验 | [里斯本旅游局](https://www.visitlisboa.com/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 里斯本 | jeronimos-monastery / 热罗尼莫斯修道院 | 15–25 EUR | 估算 / 待核验 | [里斯本旅游局](https://www.visitlisboa.com/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 里斯本 | alfama / 阿尔法玛街区 | 0 EUR | 估算 / 待核验 | [里斯本旅游局](https://www.visitlisboa.com/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 里斯本 | sao-jorge-castle / 圣乔治城堡 | 15–20 EUR | 估算 / 待核验 | [里斯本旅游局](https://www.visitlisboa.com/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 里斯本 | lisbon-oceanarium / 里斯本海洋馆 | 25–29 EUR | 已核对收费价 | [里斯本海洋馆](https://oceanario.pt/planear-visita/) | 13—64岁标准成人按入馆时段25/27/29欧元；不含缆车等组合产品。 |
| 阿姆斯特丹 | rijksmuseum / 荷兰国家博物馆 | 25 EUR | 已核对收费价 | [荷兰国立博物馆](https://www.rijksmuseum.nl/en/visit/practical-info/opening-hours-and-prices) | 成人常规门票；需预约入馆时段。 |
| 阿姆斯特丹 | van-gogh-museum / 梵高博物馆 | 25 EUR | 已核对收费价 | [梵高博物馆售票网站](https://tickets.vangoghmuseum.nl/en/tickets) | 成人常规门票；需按指定时段预约。 |
| 阿姆斯特丹 | anne-frank-house / 安妮之家 | 16.5 EUR | 已核对收费价 | [安妮之家](https://www.annefrank.org/en/museum/tickets/) | 成人博物馆参观16.50欧元，含1欧预约费；只售在线指定时段票，闭馆日须确认。 |
| 阿姆斯特丹 | vondelpark / 冯德尔公园 | 0 EUR | 估算 / 待核验 | [阿姆斯特丹官方旅游指南](https://www.iamsterdam.com/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 阿姆斯特丹 | amsterdam-canals / 阿姆斯特丹运河带 | 0 EUR | 估算 / 待核验 | [阿姆斯特丹官方旅游指南](https://www.iamsterdam.com/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 柏林 | brandenburg-gate / 勃兰登堡门 | 0 EUR | 估算 / 待核验 | [柏林旅游局](https://www.visitberlin.de/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 柏林 | reichstag-building / 德国国会大厦穹顶 | 0 EUR | 已核对免费范围 | [德国联邦议院](https://www.bundestag.de/en/visittheBundestag/dome/registration-245686) | 屋顶露台与穹顶免费，须事先登记并带身份证件；清洁维护和议会活动会限制开放。 |
| 柏林 | east-side-gallery / 东边画廊 | 0 EUR | 估算 / 待核验 | [柏林旅游局](https://www.visitberlin.de/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 柏林 | museum-island / 博物馆岛滨水步行 | 0 EUR | 估算 / 待核验 | [柏林旅游局](https://www.visitberlin.de/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 柏林 | berlin-cathedral / 柏林大教堂 | 10–15 EUR | 估算 / 待核验 | [柏林旅游局](https://www.visitberlin.de/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 威尼斯 | st-marks-basilica / 圣马可大教堂 | 10–30 EUR | 估算 / 待核验 | [威尼斯官方旅游与票务平台](https://www.veneziaunica.it/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 威尼斯 | doges-palace / 总督宫 | 30–35 EUR | 估算 / 待核验 | [威尼斯官方旅游与票务平台](https://www.veneziaunica.it/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 威尼斯 | rialto-bridge / 里亚托桥 | 0 EUR | 估算 / 待核验 | [威尼斯官方旅游与票务平台](https://www.veneziaunica.it/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 威尼斯 | grand-canal / 大运河岸边漫步 | 0 EUR | 估算 / 待核验 | [威尼斯官方旅游与票务平台](https://www.veneziaunica.it/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 威尼斯 | burano / 布拉诺岛 | 0 EUR | 估算 / 待核验 | [威尼斯官方旅游与票务平台](https://www.veneziaunica.it/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 佛罗伦萨 | uffizi / 乌菲兹美术馆 | 25–29 EUR | 已核对收费价 | [乌菲兹美术馆](https://www.uffizi.it/en/tickets) | 普通成人单馆票当日25欧元、提前购买29欧元；16点后另有优惠，瓦萨里走廊另计。 |
| 佛罗伦萨 | accademia-florence / 佛罗伦萨学院美术馆 | 16–25 EUR | 估算 / 待核验 | [佛罗伦萨官方旅游指南](https://www.feelflorence.it/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 佛罗伦萨 | florence-duomo / 圣母百花大教堂建筑群 | 20–35 EUR | 估算 / 待核验 | [佛罗伦萨官方旅游指南](https://www.feelflorence.it/en) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 佛罗伦萨 | ponte-vecchio / 老桥 | 0 EUR | 估算 / 待核验 | [佛罗伦萨官方旅游指南](https://www.feelflorence.it/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 佛罗伦萨 | piazzale-michelangelo / 米开朗基罗广场 | 0 EUR | 估算 / 待核验 | [佛罗伦萨官方旅游指南](https://www.feelflorence.it/en) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 洛杉矶 | griffith-observatory / 格里菲斯天文台 | 0 USD | 已核对免费范围 | [洛杉矶市格里菲斯天文台](https://griffithobservatory.lacity.gov/visit/accessibility/) | 建筑与户外场地免费；天象厅节目和停车另收费。 |
| 洛杉矶 | getty-center / 盖蒂中心 | 0 USD | 已核对免费范围 | [盖蒂中心](https://www.getty.edu/visit/center/faqs/) | 普通入馆免费，须预约时段；停车和特定活动另计。 |
| 洛杉矶 | santa-monica-pier / 圣莫尼卡码头 | 0 USD | 估算 / 待核验 | [洛杉矶旅游局](https://www.discoverlosangeles.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 洛杉矶 | hollywood-walk / 好莱坞星光大道 | 0 USD | 估算 / 待核验 | [洛杉矶旅游局](https://www.discoverlosangeles.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 洛杉矶 | universal-hollywood / 好莱坞环球影城 | 109–180 USD | 估算 / 待核验 | [洛杉矶旅游局](https://www.discoverlosangeles.com/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 墨尔本 | ngv / 维多利亚州国立美术馆 | 0 AUD | 已核对免费范围 | [维多利亚国立美术馆](https://www.ngv.vic.gov.au/plan-your-visit/access/) | 常设馆藏免费；特别展览可能另外收费。 |
| 墨尔本 | melbourne-botanic-gardens / 墨尔本皇家植物园 | 0 AUD | 已核对免费范围 | [维多利亚皇家植物园](https://www.rbg.vic.gov.au/melbourne-gardens/) | 墨尔本园区普通入园免费；游船、导览和特别活动另收费。 |
| 墨尔本 | federation-square / 联邦广场 | 0 AUD | 估算 / 待核验 | [墨尔本官方旅游指南](https://www.visitmelbourne.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 墨尔本 | queen-victoria-market / 维多利亚女王市场 | 0 AUD | 估算 / 待核验 | [墨尔本官方旅游指南](https://www.visitmelbourne.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 墨尔本 | st-kilda-beach / 圣基尔达海滩 | 0 AUD | 估算 / 待核验 | [墨尔本官方旅游指南](https://www.visitmelbourne.com/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |
| 清迈 | doi-suthep / 素贴山双龙寺 | 30–100 THB | 估算 / 待核验 | [泰国国家旅游局](https://www.tourismthailand.org/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 清迈 | wat-chedi-luang / 契迪龙寺 | 50–100 THB | 估算 / 待核验 | [泰国国家旅游局](https://www.tourismthailand.org/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 清迈 | wat-phra-singh / 帕辛寺 | 20–50 THB | 估算 / 待核验 | [泰国国家旅游局](https://www.tourismthailand.org/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 清迈 | doi-inthanon / 茵他侬国家公园 | 300–500 THB | 估算 / 待核验 | [泰国国家旅游局](https://www.tourismthailand.org/) | 编辑预算区间，尚未核验当前官方票价；具体日期、票种与附加项目请以官网为准。 |
| 清迈 | tha-phae-gate / 塔佩门 | 0 THB | 估算 / 待核验 | [泰国国家旅游局](https://www.tourismthailand.org/) | 仅所述公共区域按零门票规划，尚未核验当前安排；收费展览、交通及消费另计。 |

## 结构检查

已检查30个城市ID和168个景点ID唯一，所有景点具有2—3条亮点（当前均3条）、正游览时长与有效数值坐标；价格下界不大于上界，城市daily/monthly费用均为单调的三档数组。此检查不能替代实时开放状态和供应商票务验证。


## 第二轮：可选景点库与停留范围

日期：2026-09-22。本轮再增加94景点，合计262；北京市由6项扩充到42项，包括北大、清华、圆明园、皇家园林、博物馆、街区、奥运场馆与郊外目的地。其余9座重点城市均至少12项，其他20城沿用既有目录。

### 字段定义与计算边界

- `priority`：0—100的编辑优先级，数字越高越优先。核心代表点单独设置；部分原有记录按既有展示顺序递减补全。它不是星级、游客评分、客流热度或官方排名，也不能替代用户偏好。
- `durationRange.min`：只看主要亮点的略览分钟数，不承诺能走完场地；不是最低允许停留时间。
- `durationRange.recommended`：常规参观建议分钟数，与`durationHours * 60`保持一致。
- `durationRange.max`：深入参观、读展签或慢游的建议分钟数，不是场馆允许停留上限。
- 新增94项手工编写范围。原有记录若没有专门修订，min按原建议时长约50%、max按约160%，取15分钟步长；故宫、颐和园和大型博物馆等单独调整。
- 范围只用于现场参观规划，不含跨城往返、远郊交通、额外排队与用餐；长城、三星堆、古北水镇、凡尔赛等必须另留交通时间。
- `recommendedFor`为编辑主题标签。`features`与`bestTime`依旧不是实时活动、预约库存或开放时间。
- 新增图片暂缺时`image.url:null`，仅保留对应地点的Wikipedia身份页；页面可明确标示占位或“城市参考图”，不得冒充该景点实景。已有168项图源不做替换。

### 预约与闭馆核对

| 项目 | 核对结果 | 官方来源 |
| --- | --- | --- |
| 北京大学 | 校方提供校园预约入口；未预约成功不能默认入校，教学楼、宿舍等不自动开放。未取得当前校园收费字段，零元仍标estimate。 | [北京大学](https://www.pku.edu.cn/visit.html) |
| 清华大学 | 官网明确不收参观费用，须预约；校历、校内活动和极端天气可导致暂停开放。 | [清华大学校园预约](https://campusvisit.tsinghua.edu.cn/) |
| 中国国家博物馆 | 基本陈列免费实名预约；未预约、证件信息不符或错过时段无法保证入馆，收费展另计。 | [国博预约系统](https://pcticket.chnmuseum.cn/museum-en/) |
| 金沙遗址博物馆 | 官网明确2025-12-05至2027-04-30闭馆。保留目录供未来规划，availability标记日期区间；闭馆期间不能安排馆内参观。 | [馆方开放公告](https://www.jinshasitemuseum.com/node/179) |
| 伦敦自然历史博物馆 | 普通展厅免费；官网列2026-10-09单日闭馆，已记入availability；圣诞等规律闭馆还需查日历。 | [馆方参观页](https://www.nhm.ac.uk/visit.html) |
| 景山公园（原有条目更新） | 成人常规票2元，展览期间10元，升级为official。 | [北京市政府票务指南](https://english.beijing.gov.cn/specials/ticketing/parks/202407/t20240719_3753324.html) |
| 银阁寺 | 官网当前普通成人价1000日元；不沿用500日元旧成人价。 | [银阁寺参拜说明](https://www.shokoku-ji.jp/ginkakuji/access/) |

已核对记录并不代表所选日期有库存。此次新增15条有官方收费/免费证据，原景山新增1条核验；全库现为45条官方收费价、23条官方免费范围记录、194条估算。定时采集器是否已支持某来源，应以采集器配置与运行日志为准。

### 新增94项明细

“时长”依次为略览/常规/深入，单位分钟。未核验价格的入口可能只是机构介绍页，不能据此声称金额已抓取或校验。

| 城市 | 景点ID / 名称 | 时长 | 编辑优先级 | 费用与类型 | 来源入口 | 范围说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 上海 | nanjing-road / 南京路步行街 | 30/90/180 | 85 | 0 CNY / estimate | [上海官方旅游指南](https://www.meet-in-shanghai.net/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 上海 | xintiandi / 新天地 | 30/90/180 | 79 | 0 CNY / estimate | [上海官方旅游指南](https://www.meet-in-shanghai.net/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 上海 | shanghai-french-concession / 衡山路复兴路街区 | 45/150/300 | 88 | 0 CNY / estimate | [上海官方旅游指南](https://www.meet-in-shanghai.net/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 上海 | shanghai-natural-history-museum / 上海自然博物馆 | 60/180/300 | 84 | 30 CNY / official | [上海自然博物馆](https://www.snhm.org.cn/cgfw/cgzx.htm) | 成人参观票30元，四维影院30元另计；线上实名购票，注意当前休馆日。 |
| 上海 | shanghai-disneyland / 上海迪士尼乐园 | 360/540/660 | 82 | 475–850 CNY / estimate | [上海迪士尼度假区](https://www.shanghaidisneyresort.com/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 上海 | longhua-temple / 龙华寺 | 45/90/150 | 77 | 0–20 CNY / estimate | [上海官方旅游指南](https://www.meet-in-shanghai.net/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 北京 | peking-university / 北京大学校园（预约探访） | 45/120/240 | 86 | 0 CNY / estimate | [北京大学](https://www.pku.edu.cn/visit.html) | 校园参观须通过校方入口预约并核验；教学楼、宿舍等不自动开放，零元仅为预算假设，不购买所谓保入校服务。 |
| 北京 | tsinghua-university / 清华大学校园（预约探访） | 45/120/240 | 81 | 0 CNY / free | [清华大学校园参观预约系统](https://campusvisit.tsinghua.edu.cn/) | 校园不收参观费；须预约核验，开放日随校历与校内活动调整，不保证任何所选日期可入校。 |
| 北京 | old-summer-palace / 圆明园遗址公园 | 90/210/360 | 94 | 10–25 CNY / official | [圆明园遗址公园](https://www.yuanmingyuanpark.cn/) | 成人大门10元、通票25元；确认通票包含范围，游船与电瓶车另计。 |
| 北京 | beihai-park / 北海公园 | 60/150/240 | 90 | 5–20 CNY / official | [北京市人民政府](https://english.beijing.gov.cn/specials/parktours/guidevisitors/beihaipark/) | 淡季大门5元/联票15元，旺季大门10元/联票20元；游船另计，当前购票规则另核。 |
| 北京 | prince-gong-mansion / 恭王府博物馆 | 75/150/240 | 88 | 40–60 CNY / estimate | [恭王府博物馆官方预约](https://mall.pgm.org.cn/) | 编辑门票预算；须通过官方系统核对可约日期、普通门票与讲解服务。 |
| 北京 | national-museum-china / 中国国家博物馆 | 90/240/420 | 96 | 0 CNY / free | [中国国家博物馆](https://pcticket.chnmuseum.cn/museum-en/) | 基本陈列免费实名预约；未预约或错过预约时段不能保证入馆，收费特展另计。 |
| 北京 | tiananmen-square / 天安门广场 | 30/60/120 | 92 | 0 CNY / estimate | [天安门地区管理委员会预约平台](https://yuyue.tamgw.beijing.gov.cn/) | 广场按零门票规划；预约、安检及临时管理规定必须核对，不含天安门城楼参观。 |
| 北京 | qianmen-dashilar / 前门大街与大栅栏 | 45/120/210 | 86 | 0 CNY / estimate | [北京市人民政府](https://english.beijing.gov.cn/travellinginbeijing/) | 公共街巷按零门票估算；餐饮、购物、体验和馆舍另计。 |
| 北京 | shichahai / 什刹海与后海 | 45/150/270 | 88 | 0 CNY / estimate | [北京市人民政府](https://english.beijing.gov.cn/travellinginbeijing/) | 仅公共湖岸步行按零元规划；游船、人力车、酒吧和餐饮另计。 |
| 北京 | nanluoguxiang / 南锣鼓巷与周边胡同 | 30/90/180 | 77 | 0 CNY / estimate | [北京市人民政府](https://english.beijing.gov.cn/travellinginbeijing/) | 公共巷道零门票规划；私人住宅不得擅入，购物体验另计。 |
| 北京 | beijing-drum-bell-towers / 北京钟鼓楼 | 30/75/150 | 84 | 20–40 CNY / estimate | [北京市人民政府](https://english.beijing.gov.cn/) | 编辑预算包含不同登楼票种可能价差；开放、演示与联票另核，楼梯较陡。 |
| 北京 | beijing-confucius-temple / 孔庙和国子监博物馆 | 60/150/240 | 84 | 30–40 CNY / estimate | [孔庙和国子监博物馆](https://www.kmgzj.com/) | 编辑门票估算；普通参观、活动和讲解服务范围请查馆方。 |
| 北京 | 798-art-zone / 798艺术区 | 45/180/300 | 85 | 0 CNY / estimate | [北京市人民政府](https://english.beijing.gov.cn/) | 公共街区按零门票规划；UCCA等展馆及收费活动不包含。 |
| 北京 | beijing-olympic-park / 奥林匹克公园公共区 | 45/120/240 | 84 | 0 CNY / estimate | [北京市人民政府](https://english.beijing.gov.cn/) | 公共步行区按零元估算；鸟巢、水立方、观光塔等室内或登高项目另购票。 |
| 北京 | beijing-national-stadium / 国家体育场鸟巢参观 | 45/90/150 | 83 | 80–160 CNY / estimate | [国家体育场](https://www.n-s.cn/) | 参观预算估算，不含赛事、演唱会；开放层级与登顶套餐须核对。 |
| 北京 | beijing-water-cube / 国家游泳中心水立方 | 45/90/180 | 74 | 30–60 CNY / estimate | [国家游泳中心](https://www.water-cube.com/) | 普通参观编辑估算；不含游泳、水乐园、赛事或演出。 |
| 北京 | china-national-botanical-garden / 国家植物园 | 90/210/360 | 82 | 5–10 CNY / official | [北京市人民政府](https://english.beijing.gov.cn/specials/parktours/guidevisitors/nationalbotanicalgarden/) | 北园成人5元、南北园成人10元；温室、卧佛寺等单独收费区域请另核。 |
| 北京 | fragrant-hills / 香山公园 | 90/210/360 | 82 | 5–10 CNY / official | [北京市公园管理中心](https://gygl.beijing.gov.cn/mlgy/mlgy_lsmy/202305/t20230505_3087852.html) | 成人淡季5元、旺季10元；索道、碧云寺等另计，红叶期注意预约和交通。 |
| 北京 | beijing-zoo / 北京动物园 | 90/210/360 | 80 | 15–20 CNY / estimate | [北京动物园](https://www.bjzoo.com/) | 编辑预算为普通入园及熊猫馆组合的可能价差；北京海洋馆不包含。 |
| 北京 | capital-museum / 首都博物馆 | 60/180/300 | 86 | 0 CNY / estimate | [首都博物馆](https://www.capitalmuseum.org.cn/) | 基本陈列按零门票规划；当前预约及特展规则待核验。 |
| 北京 | national-natural-history-museum / 国家自然博物馆 | 60/150/270 | 81 | 0 CNY / estimate | [国家自然博物馆](https://www.nnhm.org.cn/) | 基本展览按零门票规划；需核对预约名额、特别展览与当天开放。 |
| 北京 | china-science-technology-museum / 中国科学技术馆 | 90/240/420 | 87 | 30–60 CNY / estimate | [中国科学技术馆](https://www.cstm.org.cn/) | 编辑预算；主展厅、儿童科学乐园和特效影院可能分别售票。 |
| 北京 | national-art-museum-china / 中国美术馆 | 45/120/210 | 79 | 0 CNY / estimate | [中国美术馆](https://www.namoc.org/) | 按基本入馆零门票规划；预约、闭馆与具体展览范围待核对。 |
| 北京 | military-museum-beijing / 中国人民革命军事博物馆 | 60/180/300 | 77 | 0 CNY / estimate | [中国人民革命军事博物馆](https://www.jb.mil.cn/) | 按基本陈列零门票规划；实名预约及可开放展厅须向馆方核对。 |
| 北京 | beijing-grand-canal-museum / 北京大运河博物馆 | 60/180/300 | 84 | 0 CNY / estimate | [首都博物馆及北京大运河博物馆](https://www.capitalmuseum.org.cn/) | 基本展览按零门票规划；收费特展、开放与预约须核实，往返中心城区另留时间。 |
| 北京 | beijing-library / 北京城市图书馆 | 30/90/180 | 73 | 0 CNY / estimate | [首都图书馆](https://www.clcn.net.cn/) | 公共开放区域按零元规划；入馆规则、活动预约与开放空间以馆方为准。 |
| 北京 | shougang-park / 首钢园 | 60/150/270 | 80 | 0 CNY / estimate | [首钢集团](https://www.shougang.com.cn/) | 仅公共园区步行按零门票规划；高炉内部、展览和收费活动另计。 |
| 北京 | yuyuantan-park / 玉渊潭公园 | 45/120/210 | 73 | 2–10 CNY / estimate | [北京市公园管理中心](https://gygl.beijing.gov.cn/) | 编辑预算含普通期与花期可能差异；以当期展览票价和入园规则为准。 |
| 北京 | taoranting-park / 陶然亭公园 | 45/120/210 | 71 | 2–10 CNY / estimate | [北京市公园管理中心](https://gygl.beijing.gov.cn/) | 编辑预算，展会、游船和游乐项目另计。 |
| 北京 | zhongshan-park-beijing / 北京中山公园 | 45/90/180 | 79 | 3–10 CNY / estimate | [北京市公园管理中心](https://gygl.beijing.gov.cn/) | 编辑预算；花展、园内收费区域及音乐堂不含在普通门票假设内。 |
| 北京 | temple-of-earth / 地坛公园 | 45/90/180 | 73 | 2–10 CNY / estimate | [北京市人民政府](https://english.beijing.gov.cn/) | 编辑门票预算；庙会和园中收费展区另计。 |
| 北京 | badaling-great-wall / 八达岭长城 | 90/210/330 | 91 | 35–40 CNY / official | [北京市人民政府](https://english.beijing.gov.cn/specials/ticketing/attractions/202407/t20240717_3751609.html) | 成人淡季35元、旺季40元；缆车、滑车和城区往返交通另计。 |
| 北京 | ming-tombs / 明十三陵（定陵等开放陵区） | 90/210/360 | 78 | 40–130 CNY / estimate | [明十三陵景区](https://www.mingtombs.com/) | 编辑预算对应不同陵园与组合；不是全部十三座都可入内，定陵、长陵、神路分别核价。 |
| 北京 | zhoukoudian / 周口店北京人遗址 | 90/180/300 | 75 | 30–60 CNY / estimate | [北京市文物局](https://wwj.beijing.gov.cn/) | 编辑预算，遗址与博物馆票种需分辨；山地步行、往返房山交通另留时间。 |
| 北京 | tanzhe-temple / 潭柘寺 | 90/150/240 | 76 | 50–60 CNY / estimate | [北京市文化和旅游局](https://whlyj.beijing.gov.cn/) | 编辑门票预算；特殊活动、交通和联游项目另计。 |
| 北京 | gubei-water-town / 古北水镇 | 120/300/480 | 77 | 140–240 CNY / estimate | [古北水镇](https://www.wtown.com/) | 编辑门票预算，含长城、温泉或住宿套餐价格不同；距离市区较远，应独立留出交通日程。 |
| 东京 | tokyo-national-museum / 东京国立博物馆 | 60/180/300 | 91 | 1000 JPY / official | [东京国立博物馆](https://www.tnm.jp/modules/r_free_page/?id=156&lang=en) | 成人常设馆藏展1000日元；多数特别展览另售票，具体闭馆日以馆方日历为准。 |
| 东京 | tokyo-skytree / 东京晴空塔 | 60/120/180 | 86 | 2100–4000 JPY / estimate | [东京晴空塔](https://www.tokyo-skytree.jp/en/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 东京 | tsukiji-outer-market / 筑地场外市场 | 45/120/180 | 83 | 0 JPY / estimate | [筑地场外市场](https://www.tsukiji.or.jp/english/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 东京 | akihabara / 秋叶原 | 45/150/270 | 82 | 0 JPY / estimate | [东京官方旅游指南](https://www.gotokyo.org/en/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 东京 | odaiba / 台场海滨与公共街区 | 60/180/300 | 80 | 0 JPY / estimate | [东京官方旅游指南](https://www.gotokyo.org/en/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 东京 | imperial-palace-east-gardens / 皇居东御苑 | 45/120/180 | 85 | 0 JPY / free | [日本宫内厅](https://www.kunaicho.go.jp/e-event/higashigyoen/higashigyoen.html) | 东御苑免费，不含皇居内部；有定期关闭及宫廷活动临时关闭安排。 |
| 京都 | ginkakuji / 银阁寺 | 45/90/150 | 89 | 1000 JPY / official | [相国寺派银阁寺](https://www.shokoku-ji.jp/ginkakuji/access/) | 官网现列普通成人（高中生及以上）1000日元；不能继续沿用旧的500日元成人价。 |
| 京都 | ryoanji / 龙安寺 | 45/90/150 | 85 | 600 JPY / official | [龙安寺](https://www.ryoanji.jp/smph/) | 普通成人参拜600日元；高校生、儿童等另有资格票价。 |
| 京都 | nanzenji / 南禅寺与水路阁 | 45/120/210 | 88 | 0–1200 JPY / estimate | [南禅寺](https://www.nanzenji.or.jp/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 京都 | nishiki-market / 锦市场 | 45/90/180 | 83 | 0 JPY / estimate | [京都锦市场商店街](https://www.kyoto-nishiki.or.jp/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 京都 | philosophers-path / 哲学之道 | 30/75/150 | 82 | 0 JPY / estimate | [京都市官方旅游指南](https://kyoto.travel/en/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 京都 | sanjusangendo / 三十三间堂 | 45/90/150 | 87 | 600–800 JPY / estimate | [三十三间堂](https://www.sanjusangendo.jp/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 巴黎 | versailles / 凡尔赛宫 | 150/300/480 | 93 | 25–40 EUR / estimate | [凡尔赛宫](https://en.chateauversailles.fr/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 巴黎 | notre-dame-paris / 巴黎圣母院 | 30/90/180 | 92 | 0 EUR / free | [巴黎圣母院](https://www.notredamedeparis.fr/en/visit/reservation-free/) | 教堂普通入内免费，可选官方免费预约；塔楼和其他独立收费项目不包含。 |
| 巴黎 | sainte-chapelle / 圣礼拜堂 | 30/75/120 | 89 | 13–25 EUR / estimate | [法国国家古迹中心](https://www.sainte-chapelle.fr/en/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 巴黎 | palais-garnier / 巴黎歌剧院加尼叶宫 | 45/120/180 | 88 | 15–25 EUR / estimate | [巴黎歌剧院](https://www.operadeparis.fr/en/visits/palais-garnier) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 巴黎 | le-marais / 玛黑区 | 45/150/300 | 84 | 0 EUR / estimate | [巴黎旅游局](https://parisjetaime.com/eng/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 巴黎 | musee-rodin / 罗丹博物馆 | 60/150/240 | 84 | 15–20 EUR / estimate | [罗丹博物馆](https://www.musee-rodin.fr/en/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 伦敦 | westminster-abbey / 威斯敏斯特教堂 | 60/150/240 | 93 | 30–40 GBP / estimate | [威斯敏斯特教堂](https://www.westminster-abbey.org/visit-us/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 伦敦 | buckingham-palace / 白金汉宫外观与周边 | 30/60/120 | 88 | 0 GBP / estimate | [英国皇家收藏信托](https://www.rct.uk/visit/buckingham-palace) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 伦敦 | natural-history-museum-london / 伦敦自然历史博物馆 | 60/210/360 | 92 | 0 GBP / free | [伦敦自然历史博物馆](https://www.nhm.ac.uk/visit.html) | 常设展厅免费，建议预约入馆；收费特展与活动另计。官网列2026-10-09临时闭馆。 |
| 伦敦 | victoria-albert-museum / 维多利亚与阿尔伯特博物馆 | 60/180/330 | 90 | 0 GBP / free | [维多利亚与阿尔伯特博物馆](https://www.vam.ac.uk/visit) | 普通馆藏入场免费；特别展览及活动可能收费。 |
| 伦敦 | tower-bridge / 伦敦塔桥展览 | 30/90/150 | 88 | 13–17 GBP / estimate | [伦敦塔桥](https://www.towerbridge.org.uk/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 伦敦 | greenwich-park / 格林尼治公园与河岸 | 60/180/300 | 85 | 0 GBP / estimate | [英国皇家公园](https://www.royalparks.org.uk/visit/parks/greenwich-park) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 成都 | chengdu-museum / 成都博物馆 | 60/180/300 | 90 | 0 CNY / estimate | [成都博物馆](https://www.cdmuseum.com/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 成都 | jinsha-site / 金沙遗址博物馆 | 90/180/300 | 87 | 70–90 CNY / estimate | [金沙遗址博物馆](https://www.jinshasitemuseum.com/) | 闭馆期间无可用参观报价；70—90元仅为重开后待核价的规划占位，不是当前可购门票。 |
| 成都 | sanxingdui / 三星堆博物馆（广汉） | 120/240/360 | 94 | 72–90 CNY / estimate | [三星堆博物馆](https://www.sxd.cn/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 成都 | dujiangyan / 都江堰景区 | 120/240/360 | 89 | 80–100 CNY / estimate | [青城山都江堰旅游景区](https://www.djy517.com/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 成都 | mount-qingcheng / 青城山前山 | 150/300/420 | 85 | 80–150 CNY / estimate | [青城山都江堰旅游景区](https://www.djy517.com/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 成都 | chengdu-peoples-park / 成都人民公园 | 30/90/180 | 86 | 0 CNY / estimate | [成都官方城市指南](https://www.gochengdu.cn/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 成都 | wenshu-monastery / 文殊院 | 45/120/180 | 82 | 0 CNY / estimate | [成都官方城市指南](https://www.gochengdu.cn/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 西安 | xian-bell-tower / 西安钟楼 | 30/60/120 | 88 | 30–50 CNY / estimate | [陕西省人民政府](https://en.shaanxi.gov.cn/tourism/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 西安 | xian-drum-tower / 西安鼓楼 | 30/60/120 | 81 | 30–50 CNY / estimate | [陕西省人民政府](https://en.shaanxi.gov.cn/tourism/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 西安 | small-wild-goose-pagoda / 小雁塔与西安博物院 | 60/150/240 | 86 | 0 CNY / estimate | [西安博物院](https://www.xabwy.com/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 西安 | tang-paradise / 大唐芙蓉园 | 90/210/330 | 77 | 90–150 CNY / estimate | [陕西省人民政府](https://en.shaanxi.gov.cn/tourism/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 西安 | daming-palace / 大明宫国家遗址公园 | 60/180/300 | 85 | 0–60 CNY / estimate | [陕西省人民政府](https://en.shaanxi.gov.cn/tourism/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 西安 | huaqing-palace / 华清宫 | 90/180/300 | 82 | 110–150 CNY / estimate | [华清宫](https://www.hqc.cn/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 西安 | han-yangling / 汉景帝阳陵博物院 | 90/180/300 | 80 | 60–90 CNY / estimate | [汉景帝阳陵博物院](https://www.hylae.com/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 杭州 | leifeng-pagoda / 雷峰塔 | 45/90/150 | 85 | 40–60 CNY / estimate | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 杭州 | liuhe-pagoda / 六和塔 | 45/120/180 | 80 | 20–30 CNY / estimate | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 杭州 | china-national-tea-museum / 中国茶叶博物馆双峰馆区 | 60/150/240 | 83 | 0 CNY / estimate | [中国茶叶博物馆](https://www.teamuseum.cn/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 杭州 | zhejiang-provincial-museum / 浙江省博物馆之江馆区 | 90/210/360 | 88 | 0 CNY / estimate | [浙江省博物馆](https://www.zhejiangmuseum.com/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 杭州 | liangzhu-museum / 良渚博物院 | 60/150/240 | 85 | 0 CNY / estimate | [良渚博物院](https://www.lzmuseum.cn/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 杭州 | gushan-hangzhou / 孤山与西泠印社周边 | 45/120/210 | 82 | 0 CNY / estimate | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 杭州 | gongchen-bridge / 拱宸桥与运河街区 | 45/150/240 | 84 | 0 CNY / estimate | [杭州市文化广电旅游局](https://wgly.hangzhou.gov.cn/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 广州 | guangdong-museum / 广东省博物馆 | 60/180/300 | 89 | 0 CNY / estimate | [广东省博物馆](https://www.gdmuseum.com/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 广州 | nanyue-king-museum / 南越王博物院王墓展区 | 60/150/240 | 88 | 10–20 CNY / estimate | [南越王博物院](https://www.gznywmuseum.org/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |
| 广州 | sacred-heart-guangzhou / 石室圣心大教堂 | 30/60/120 | 78 | 0 CNY / estimate | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 广州 | beijing-road-guangzhou / 北京路步行街 | 30/120/210 | 85 | 0 CNY / estimate | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 广州 | yongqing-fang / 永庆坊与荔湾老街 | 45/150/240 | 87 | 0 CNY / estimate | [广州市人民政府](https://www.gz.gov.cn/guangzhouinternational/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 广州 | guangzhou-opera-house / 广州大剧院建筑外观 | 20/45/90 | 75 | 0 CNY / estimate | [广州大剧院](https://www.gzdjy.org/) | 仅描述的公共区域/基本参观按零门票规划，当前入场与预约规则未核验；消费、特展和附加体验另计。 |
| 广州 | chimelong-safari-park / 长隆野生动物世界 | 240/420/540 | 86 | 300–450 CNY / estimate | [长隆旅游度假区](https://www.chimelong.com/) | 编辑预算区间，未核验当前官方可购买价格；按所选日期、票种和附加服务到官方入口核价。 |

### 本轮结构核验

检查覆盖30个城市、262个景点：ID唯一，所有景点具有有效坐标、3条亮点、分类、建议时段、0—100优先级，且min≤recommended≤max、建议分钟数与durationHours一致。原预算三档结构及币种保持兼容。可选目录规模不代表全部票价已验证或全部地点当前可入内。
