# 城市餐厅、特色住宿与导览来源

核实日期：2026-09-22。本轮目录覆盖30个城市、30家具体餐厅、30家具体酒店。活动由独立目录维护，本文件不重复活动。目录是精选起点，不能声称涵盖全城或世界全部商家。

## 证据与价格边界

- 顶层 `checkedAt` 表示本轮通过商家官网或官方旅游机构资料核实商家身份、位置或公开服务；它不表示房间库存、餐位或报价实时有效。
- 每个 `priceOptions[].type` 单独标记。21项使用可直接读取的官网菜单金额或逐项相加；111项为编辑预算，全部 `checkedAt: null`。所有酒店价格都是估算，没有捏造日期库存或即时房价。
- 酒店估算均按每间每晚，不默认早餐、税、加床、停车、SPA、机场接送包含。未能核实具体房型时，保留“房型待选”且仅提供一个住宿预算选项；不编造房型。
- 餐厅估算中的“自选”“分享餐”是本应用的点餐预算结构，不是商家在售套餐。人数、食材重量、税费与服务费会改变实际账单。
- 经纬度是根据已核实地址作的编辑近似定位，只适合城市级规划；不是导航入口或商家提供的GPS精确值。
- 无商家实景照片时不借用城市照片冒充商家；本轮未给任何记录添加不真实的 `imageRef`。
- `bookingUrl` 为商家或权威资料入口，不保证该页有在线预订；部分商家须电话或现场候位。跳转不构成订单。

## 固定套餐与餐次

`unit: "booking"` 的价格是整套总额，按 `ceil(出行人数 / partyCapacity)` 套计费。逸龙阁四人菜单为2434.61元/桌（2088×1.166），2人仍算1桌；谧寻双人素食火锅为600–1000元/套估算，1人也不拆半价。此容量仅为套餐覆盖人数，不保证商家允许任意人数或拆桌，预订须确认。

`mealTypes` 在每个餐厅选项上表达可安排餐次。早餐、午市点心及只做白天服务的项目不作为晚餐选择。它不是分钟级营业日历，节假日、最后点单、临时休业仍须访问官网确认。酒店选项的 `mealTypes` 为空数组。

## 可直接核对的金额

| 商家 | 官网金额或加总 | 本应用处理 |
| --- | --- | --- |
| 上海逸龙阁 | 点心午餐298元/人；四人家庭菜单2088元；主厨品鉴988元/人；均加16.6% | 347.47元/人、2434.61元/桌、1152.01元/人；点心仅午餐 |
| 东京一兰涩谷 | 拉面1180、半熟蛋160、替玉210、茶280日元 | 单碗1180；蛋组合1340；替玉与茶组合1670。组合是单品相加，不是套餐；深夜附加费未计 |
| 京都锦饺子 | 饺子495、炸鸡660、黄瓜385、乌龙茶220日元，堂食含税 | 715、1155、1760日元的自选组合。官方地址页确认498-1；只按午餐安排 |
| 大阪今井本店 | 狐狸乌冬930、锅烧1850、乌冬寄锅5500日元，含税 | 直接使用三种真实菜品；锅物预约与最后点单另确认 |
| 纽约Katz’s | 店内菜单栏目三明治28.95、丸子汤9.95、土豆饼16.95美元 | 28.95、38.90、45.90美元；不含未公布的销售税、小费及额外配料 |
| 里斯本贝伦蛋挞 | 蛋挞1.60、浓缩1.20、鳕鱼球1.90、切片面包火腿芝士烤三明治3.30、鲜橙汁4.00欧元 | 轻食组合2.80、4.70、8.90欧元；不是正式晚餐 |
| 阿姆斯特丹The Pantry | Dutch Delight26.50、Volendam Fish35.95、Full Pantry43.75欧元 | 直接使用三套真实菜单；饮料和加点另计 |

上海套餐来源：[官方套餐页](https://www.peninsula.com/en/shanghai/special-offers/dining/sumptuous-set-menus-at-yi-long-court)。其余对应链接在逐条目录中。

## 特别核对结果

- 柏林Max und Moritz官网公开PDF虽可读取金额，但没有确认当前生效日，且URL含旧年份；三个选项均为estimate，低端参考公开菜单、高端为编辑余量。不能当现时保证售价。
- 罗马Roscioli检索到旧菜单PDF，未拿旧文件金额冒充当前报价。
- 上海菜单加价与纽约销售税采用不同处理：前者明确可计算所以已计入；后者未核定税和小费所以明确排除。
- Venissa意大利语官网明确七道、十道品鉴及配酒；使用这些真实服务区别，金额仍估算。不能误用同一园区Osteria餐厅的价格。
- 成都官网现使用Upper House Chengdu；保留中文“博舍”帮助识别。餐厅和酒店地址为笔帖式街81号。
- 香港大澳文物酒店远离市区，明确标注交通定位；河谷酒店Alila Ubud在乌布以北，未把它放在乌布镇中心。
- 清迈Huen Phen官网分店页经HTTP读取确认老城112号分店仍列示，避免把Nimman分店与老城地址混在一起。
- 8–16人République聚餐价135美元、JUMBO特定节日团队菜单、7 Portes预订团队菜单均未当作普通散客在任何日期可用的报价。

## 逐条来源与核实内容

下表中“官方价”仅指有官方价的选项；同一条记录仍可存在估算选项。金额证据以数据内priceOptions为准。

| ID | 地点 | 核实内容 | 来源 | 价格证据 |
| --- | --- | --- | --- | --- |
| ex-shanghai-restaurant-yi-long-court | 逸龙阁 | 身份、菜系/公开服务及所在街区 | [上海半岛酒店](https://www.peninsula.com/en/shanghai/special-offers/dining/sumptuous-set-menus-at-yi-long-court) | 官网菜单金额；附加项见选项说明 |
| ex-beijing-restaurant-huang-ting | 凰庭 | 身份、菜系/公开服务及所在街区 | [北京王府半岛酒店](https://www.peninsula.com/en/beijing/hotel-fine-dining/huang-ting-chinese-restaurant) | 编辑估算，未核实当前可订价格 |
| ex-tokyo-restaurant-ichiran-shibuya | 一兰拉面·涩谷店 | 身份、菜系/公开服务及所在街区 | [ICHIRAN](https://ichiran.com/shop/tokyo/shibuya/) | 官网菜单金额；附加项见选项说明 |
| ex-kyoto-restaurant-nishiki-gyoza | 锦市场·にしきギョーザ | 身份、菜系/公开服务及所在街区 | [TELACOYA](https://www.telacoya.co.jp/nishikigyoza/menu.html) | 官网菜单金额；附加项见选项说明 |
| ex-osaka-restaurant-imai-honten | 道顿堀今井·本店 | 身份、菜系/公开服务及所在街区 | [道頓堀今井](https://www.d-imai.com/shops/honten/) | 官网菜单金额；附加项见选项说明 |
| ex-seoul-restaurant-myeongdong-kyoja | 明洞饺子·本店 | 身份、菜系/公开服务及所在街区 | [Myeongdong Kyoja](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=99925) | 编辑估算，未核实当前可订价格 |
| ex-bangkok-restaurant-thipsamai | Thipsamai·鬼门店 | 身份、菜系/公开服务及所在街区 | [Thipsamai](https://thipsamai.com/) | 编辑估算，未核实当前可订价格 |
| ex-singapore-restaurant-jumbo-riverside | 珍宝海鲜·Riverside Point | 身份、菜系/公开服务及所在街区 | [JUMBO Seafood](https://www.jumboseafood.com.sg/en/riverside-point) | 编辑估算，未核实当前可订价格 |
| ex-bali-restaurant-casa-luna | Casa Luna·乌布 | 身份、菜系/公开服务及所在街区 | [Casa Luna](https://casalunabali.com/) | 编辑估算，未核实当前可订价格 |
| ex-paris-restaurant-chartier | Bouillon Chartier·Grands Boulevards | 身份、菜系/公开服务及所在街区 | [Bouillon Chartier](https://www.bouillon-chartier.com/) | 编辑估算，未核实当前可订价格 |
| ex-london-restaurant-dishoom | Dishoom·Covent Garden | 身份、菜系/公开服务及所在街区 | [Dishoom](https://www.dishoom.com/covent-garden/) | 编辑估算，未核实当前可订价格 |
| ex-rome-restaurant-roscioli | Roscioli 熟食餐厅 | 身份、菜系/公开服务及所在街区 | [Roscioli](https://salumeriaroscioli.com/pages/contact) | 编辑估算，未核实当前可订价格 |
| ex-barcelona-restaurant-7-portes | 7 Portes | 身份、菜系/公开服务及所在街区 | [7 Portes](https://7portes.com/ca/reservar-taula-restaurant/) | 编辑估算，未核实当前可订价格 |
| ex-new-york-restaurant-katz | Katz’s 熟食店 | 身份、菜系/公开服务及所在街区 | [Katz’s Delicatessen](https://katzsdelicatessen.com/) | 官网菜单金额；附加项见选项说明 |
| ex-sydney-restaurant-bills | bills·Surry Hills | 身份、菜系/公开服务及所在街区 | [bills](https://www.bills.com.au/locations/surry-hills) | 编辑估算，未核实当前可订价格 |
| ex-dubai-restaurant-arabian-tea-house | Arabian Tea House·Al Fahidi | 身份、菜系/公开服务及所在街区 | [Arabian Tea House](https://arabianteahouse.com/al-fahidi/) | 编辑估算，未核实当前可订价格 |
| ex-istanbul-restaurant-pandeli | Pandeli | 身份、菜系/公开服务及所在街区 | [Pandeli](https://pandeli.com.tr/) | 编辑估算，未核实当前可订价格 |
| ex-hong-kong-restaurant-tim-ho-wan | 添好运·深水埗 | 身份、菜系/公开服务及所在街区 | [添好运](https://www.timhowan.com.hk/our-stores/) | 编辑估算，未核实当前可订价格 |
| ex-chengdu-restaurant-mi-xun | 谧寻茶室 | 身份、菜系/公开服务及所在街区 | [Upper House Chengdu（原博舍）](https://www.upperhouse.com/en/chengdu/restaurants-and-bars/mi-xun-teahouse/) | 编辑估算，未核实当前可订价格 |
| ex-xian-restaurant-dolce-vita | Dolce Vita·罗马假日 | 身份、菜系/公开服务及所在街区 | [西安索菲特传奇酒店](https://all.accor.com/hotel/6156/index.id.shtml) | 编辑估算，未核实当前可订价格 |
| ex-hangzhou-restaurant-jin-sha | 金沙厅 | 身份、菜系/公开服务及所在街区 | [杭州西子湖四季酒店](https://www.fourseasons.com/hangzhou/dining/restaurants/jin_sha/jin_sha_main/) | 编辑估算，未核实当前可订价格 |
| ex-guangzhou-restaurant-hongtu-hall | 宏图府 | 身份、菜系/公开服务及所在街区 | [白天鹅宾馆](https://whiteswanhotel.com/en/dining) | 编辑估算，未核实当前可订价格 |
| ex-lisbon-restaurant-pasteis-belem | 贝伦蛋挞店 | 身份、菜系/公开服务及所在街区 | [Pastéis de Belém](https://pasteisdebelem.pt/menu/?lang=en) | 官网菜单金额；附加项见选项说明 |
| ex-amsterdam-restaurant-pantry | The Pantry | 身份、菜系/公开服务及所在街区 | [The Pantry](https://www.thepantry.nl/menukaart/) | 官网菜单金额；附加项见选项说明 |
| ex-berlin-restaurant-max-moritz | Max und Moritz | 身份、菜系/公开服务及所在街区 | [Max und Moritz](https://maxundmoritzberlin.de/) | 编辑估算，未核实当前可订价格 |
| ex-venice-restaurant-venissa | Venissa 餐厅 | 身份、菜系/公开服务及所在街区 | [Venissa](https://www.venissa.it/ristorante/) | 编辑估算，未核实当前可订价格 |
| ex-florence-restaurant-dalloste | Trattoria Dall’Oste·Chianineria | 身份、菜系/公开服务及所在街区 | [Trattoria Dall’Oste](https://trattoriadalloste.com/en/) | 编辑估算，未核实当前可订价格 |
| ex-los-angeles-restaurant-republique | République | 身份、菜系/公开服务及所在街区 | [République](https://republiquela.com/) | 编辑估算，未核实当前可订价格 |
| ex-melbourne-restaurant-chin-chin | Chin Chin·墨尔本 | 身份、菜系/公开服务及所在街区 | [Chin Chin](https://www.chinchin.melbourne/) | 编辑估算，未核实当前可订价格 |
| ex-chiang-mai-restaurant-huen-phen | Huen Phen·老城店 | 身份、菜系/公开服务及所在街区 | [Huen Phen](https://huenphenchiangmai.com/branch/) | 编辑估算，未核实当前可订价格 |
| ex-shanghai-hotel-peninsula | 上海半岛酒店 | 身份、住宿类别/公开设施及所在街区 | [The Peninsula Shanghai](https://www.peninsula.com/en/shanghai/5-star-luxury-hotel-bund) | 编辑估算，未核实当前可订价格 |
| ex-beijing-hotel-peninsula | 北京王府半岛酒店 | 身份、住宿类别/公开设施及所在街区 | [The Peninsula Beijing](https://www.peninsula.com/en/beijing/5-star-luxury-hotel-wangfujing) | 编辑估算，未核实当前可订价格 |
| ex-tokyo-hotel-hoshinoya | 虹夕诺雅东京 | 身份、住宿类别/公开设施及所在街区 | [HOSHINOYA Tokyo](https://hoshinoresorts.com/en/hotels/hoshinoyatokyo/) | 编辑估算，未核实当前可订价格 |
| ex-kyoto-hotel-kanra | 京都甘乐酒店 | 身份、住宿类别/公开设施及所在街区 | [hotel kanra kyoto](https://www.uds-hotels.com/en/kanra/kyoto/) | 编辑估算，未核实当前可订价格 |
| ex-osaka-hotel-omo7 | OMO7 大阪 | 身份、住宿类别/公开设施及所在街区 | [OMO7 Osaka by Hoshino Resorts](https://hoshinoresorts.com/en/hotels/omo7osaka/) | 编辑估算，未核实当前可订价格 |
| ex-seoul-hotel-ryse | RYSE 弘大酒店 | 身份、住宿类别/公开设施及所在街区 | [RYSE, Autograph Collection](https://www.marriott.com/en-us/hotels/selsa-ryse-autograph-collection/rooms/) | 编辑估算，未核实当前可订价格 |
| ex-bangkok-hotel-ariyasom | Ariyasom Villa | 身份、住宿类别/公开设施及所在街区 | [Ariyasom Villa](https://www.ariyasom.com/) | 编辑估算，未核实当前可订价格 |
| ex-singapore-hotel-raffles | 新加坡莱佛士酒店 | 身份、住宿类别/公开设施及所在街区 | [Raffles Singapore](https://www.raffles.com/singapore/) | 编辑估算，未核实当前可订价格 |
| ex-bali-hotel-alila-ubud | 阿丽拉乌布 | 身份、住宿类别/公开设施及所在街区 | [Alila Ubud](https://www.hyatt.com/alila-hotels-and-resorts/en-US/dpsau-alila-ubud) | 编辑估算，未核实当前可订价格 |
| ex-paris-hotel-henriette | Henriette 酒店 | 身份、住宿类别/公开设施及所在街区 | [Hôtel Henriette](https://www.hotelhenriette.com/) | 编辑估算，未核实当前可订价格 |
| ex-london-hotel-hoxton-holborn | The Hoxton·Holborn | 身份、住宿类别/公开设施及所在街区 | [The Hoxton, Holborn](https://thehoxton.com/london/holborn/) | 编辑估算，未核实当前可订价格 |
| ex-rome-hotel-locarno | Locarno 酒店 | 身份、住宿类别/公开设施及所在街区 | [Hotel Locarno](https://www.hotellocarno.com/en/contact) | 编辑估算，未核实当前可订价格 |
| ex-barcelona-hotel-casa-bonay | Casa Bonay | 身份、住宿类别/公开设施及所在街区 | [Casa Bonay](https://casabonay.com/) | 编辑估算，未核实当前可订价格 |
| ex-new-york-hotel-bowery | The Bowery Hotel | 身份、住宿类别/公开设施及所在街区 | [The Bowery Hotel](https://theboweryhotel.com/rooms/) | 编辑估算，未核实当前可订价格 |
| ex-sydney-hotel-old-clare | The Old Clare Hotel | 身份、住宿类别/公开设施及所在街区 | [The Old Clare Hotel](https://www.odehotels.com/the-old-clare-hotel/) | 编辑估算，未核实当前可订价格 |
| ex-dubai-hotel-xva | XVA 艺术酒店 | 身份、住宿类别/公开设施及所在街区 | [XVA Art Hotel](https://www.xvahotel.com/) | 编辑估算，未核实当前可订价格 |
| ex-istanbul-hotel-pera-palace | 佩拉宫酒店 | 身份、住宿类别/公开设施及所在街区 | [Pera Palace Hotel](https://perapalace.com/en/) | 编辑估算，未核实当前可订价格 |
| ex-hong-kong-hotel-tai-o | 大澳文物酒店 | 身份、住宿类别/公开设施及所在街区 | [Tai O Heritage Hotel](https://www.taioheritagehotel.com/en/) | 编辑估算，未核实当前可订价格 |
| ex-chengdu-hotel-upper-house | 成都博舍（Upper House Chengdu） | 身份、住宿类别/公开设施及所在街区 | [Upper House Chengdu](https://www.upperhouse.com/en/chengdu/) | 编辑估算，未核实当前可订价格 |
| ex-xian-hotel-sofitel-legend | 西安索菲特传奇酒店 | 身份、住宿类别/公开设施及所在街区 | [Sofitel Legend Peoples Grand Hotel Xian](https://all.accor.com/hotel/6156/index.en.shtml) | 编辑估算，未核实当前可订价格 |
| ex-hangzhou-hotel-four-seasons | 杭州西子湖四季酒店 | 身份、住宿类别/公开设施及所在街区 | [Four Seasons Hotel Hangzhou at West Lake](https://www.fourseasons.com/hangzhou/) | 编辑估算，未核实当前可订价格 |
| ex-guangzhou-hotel-white-swan | 白天鹅宾馆 | 身份、住宿类别/公开设施及所在街区 | [White Swan Hotel](https://www.whiteswanhotel.com/en) | 编辑估算，未核实当前可订价格 |
| ex-lisbon-hotel-memmo-alfama | Memmo Alfama | 身份、住宿类别/公开设施及所在街区 | [Memmo Alfama](https://www.memmohotels.com/alfama/) | 编辑估算，未核实当前可订价格 |
| ex-amsterdam-hotel-hoxton-lloyd | The Hoxton·Lloyd | 身份、住宿类别/公开设施及所在街区 | [The Hoxton, Lloyd Amsterdam](https://thehoxton.com/amsterdam/lloyd/rooms/) | 编辑估算，未核实当前可订价格 |
| ex-berlin-hotel-michelberger | Michelberger Hotel | 身份、住宿类别/公开设施及所在街区 | [Michelberger Hotel](https://www.michelbergerhotel.com/en/rooms/) | 编辑估算，未核实当前可订价格 |
| ex-venice-hotel-venissa-wine | Venissa Wine Resort | 身份、住宿类别/公开设施及所在街区 | [Venissa Wine Resort](https://www.venissa.it/en/wineresort/) | 编辑估算，未核实当前可订价格 |
| ex-florence-hotel-number-nine | Firenze Number Nine | 身份、住宿类别/公开设施及所在街区 | [Firenze Number Nine](https://firenzenumbernine.com/) | 编辑估算，未核实当前可订价格 |
| ex-los-angeles-hotel-line-la | The LINE LA | 身份、住宿类别/公开设施及所在街区 | [The LINE LA](https://www.thelinehotel.com/los-angeles/) | 编辑估算，未核实当前可订价格 |
| ex-melbourne-hotel-ovolo | Ovolo Melbourne·South Yarra | 身份、住宿类别/公开设施及所在街区 | [Ovolo Melbourne, South Yarra](https://ovolohotels.com/ovolo/south-yarra/) | 编辑估算，未核实当前可订价格 |
| ex-chiang-mai-hotel-rimping | Rimping Village | 身份、住宿类别/公开设施及所在街区 | [Rimping Village](https://www.rimpingvillage.com/) | 编辑估算，未核实当前可订价格 |

## 城市导览依据

`city-guides.json` 提供30城的编辑导览，每城有简介、2种餐饮方向、2个街区和行程提示。它归纳已有景点目录、本轮商家信息与官方旅游机构资料，不是营业、房价或安全保证。餐饮名称是城市风味线索，不表示以上唯一一家餐厅供应全部当地菜。导览中的时间安排与预算建议属于编辑判断。

重点查阅来源：

- [北京烤鸭·北京市文旅资料](https://english.visitbeijing.com.cn/article/47ONG9Wn3mb)：北京餐饮传统；胡同、园林与校园依据既有景点目录的政府/园林/学校来源。
- [京都官方餐饮导览](https://kyoto.travel/en/see-and-do/eat-and-drink.html)与[锦市场用餐规则](https://global.kyoto.travel/en/faq/detail.php?faq_id=4017)：京料理方向、锦市场不可边走边吃。
- [乌布·印尼旅游局](https://www.indonesia.travel/uk/en/destination/bali-nusa-tenggara/bali/ubud)：乌布定位、地方餐食和咖啡/稻田体验。
- [迪拜官方2026城市指南](https://www.visitdubai.com/-/media/Images/pdf/2026/dubai-city-guide-en-2026.pdf)：Al Fahidi风塔与历史街区、不同城市分区。
- [罗马旅游局传统料理](https://www.turismoroma.it/en/node/53739)：罗马意面与Trastevere、Testaccio等街区。
- [香港旅游局深水埗](https://tastehk.discoverhongkong.com/en/neighbourhoods/sham-shui-po)：街市、点心及社区文化。
- [悉尼官方bills介绍](https://www.sydney.com/destinations/sydney/inner-sydney/surry-hills/food-and-drink/bills-surry-hills)：Surry Hills早午餐与代表菜。
- [泰国旅游局清迈夜间与餐饮](https://www.tourismthailand.org/Articles/a-vivid-night-out-in-chiang-mai)：古城、市场和北泰餐食。
- [清迈Rimping官方社区介绍](https://www.rimpingvillage.com/)：Wat Gate与平河东岸。
- [阿姆斯特丹The Pantry菜单](https://www.thepantry.nl/menukaart/)、[Lloyd官方街区及房型](https://thehoxton.com/amsterdam/lloyd/rooms/)：荷兰家常菜与Eastern Docklands。
- [里斯本贝伦糕点店](https://pasteisdebelem.pt/en/)与[Memmo Alfama](https://www.memmohotels.com/alfama/)：贝伦糕点、Alfama坡路/河景定位。
- [Venissa官方](https://www.venissa.it/ristorante/)与[酒庄住宿](https://www.venissa.it/en/wineresort/)：Mazzorbo、葡萄园及潟湖用餐。
- 其他城市的地标与街区来源沿用[景点来源文档](sources.md)及[扩展说明](expansion.md)，餐饮和住宿身份以本页逐条官网链接为依据。

## 维护

本轮是人工辅助联网核实与编辑整理，并非60家实时价格适配器已全部实现。更新时先确认来源、分店、菜品单位、人数、税费、有效期和餐次，再调整金额。动态房价必须获得日期与人数，并接合规的官方/授权预订接口；抓不到可用报价就继续标估算，不提升为official。旧PDF须保留发布时间/失效风险；商家身份核实不能自动刷新价格checkedAt。结构与关键计价约束由tests/city-experiences.test.mjs检查。


## 2026-09-22 链接入口复核

检查对象为当日 `experience-audit.json` 的 89 条链接（69 条可访问、20 条待复核），并逐项比对餐宿源文件。本轮没有发现审计已确认的 HTTP 404；403、405、429、连接失败和正文读取超时只表示本次自动访问未完成，不足以判断网站失效。Thipsamai、Arabian Tea House、Pera Palace 本轮网页复核可正常读取，保留官方域名。半岛跳转至 peninsula.com.cn 属于同品牌地区站，未据此判断错误跳转。

修正 10 条餐宿记录的入口，不改变金额或价格核验日期：

- 北京王府半岛由凰庭餐厅页改为[酒店首页](https://www.peninsula.com/en/beijing/5-star-luxury-hotel-wangfujing)；[北京官方旅游介绍](https://english.visitbeijing.com.cn/article/4QDmdKYojog)亦列出此网址。
- 成都博舍和广州白天鹅由各自餐饮页改为[Upper House Chengdu 酒店首页](https://www.upperhouse.com/en/chengdu/)和[白天鹅酒店首页](https://www.whiteswanhotel.com/en)。后者需浏览器加载页面资源。
- 西安索菲特传奇酒店使用[雅高官方英文酒店页](https://all.accor.com/hotel/6156/index.en.shtml)，Dolce Vita 的商家入口也指向该页；餐厅原有资料引用保留。官方不同语言/餐饮页面说明有差异，仍要求向酒店核实营业。
- Max und Moritz 的商家来源改为[餐厅官网](https://maxundmoritzberlin.de/)，联系入口改为[官方订位说明](https://maxundmoritzberlin.de/reservierung/)，不再用旧菜单 PDF 作为预订入口。旧 PDF 只留在各估算选项的来源字段，估算标记不变。
- 添好运改为[官方门店页](https://www.timhowan.com.hk/our-stores/)，其中列有深水埗福荣街 9–11 号及电话；旅游局的菜品介绍仍作为原预算依据。
- Arabian Tea House 改为[Al Fahidi 分店页](https://arabianteahouse.com/al-fahidi/)，避免到品牌多分店首页再寻找分店。这里只调整入口，未把原来的自选组合预算升级为已核验报价。
- 金沙厅的商家入口改为[餐厅介绍与订位入口](https://www.fourseasons.com/hangzhou/dining/restaurants/jin_sha/)，菜单来源单独保留。
- 明洞饺子商家入口改为韩国旅游发展局[商家介绍页](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=99925)明确链接的[餐厅官网](https://www.mdkj.co.kr/)。官网本轮超时，旅游局资料来源仍保留，并提示出发前电话确认现址与营业；未把未能核实的第三方迁址信息写成事实。

`bookingUrl` 是商家官方入口或官方订位说明，不表示所有商家均有在线订位、目前有空位，或已完成任何预订。来源健康审计由维护程序后续重跑；本次不手工篡改其 HTTP 结果，不把能打开页面当作价格重新核验。
