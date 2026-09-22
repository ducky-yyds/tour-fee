# 欧洲目的地扩容依据

资料访问日期：2026-09-22。本批新增 20 个目的地、160 个具体景点，覆盖 14 个国家。数据在 `data/expansion/europe.json`，每城 8 个景点，城市主页指南含 2 项饮食特色与 2 个区域介绍。

## 计价与范围

所有新增景点票价均标记为 `estimate` 且 `checkedAt:null`，不宣称已取得当前官方成交价。来源字段提供官方目的地资料入口，用于地点和游览内容核对；**官方旅游页面的存在不意味着票价已核验**。即使页面显示某一票价，也没有将它批量外推到其他票种、日期或景点。

每日三档是编辑预算：住宿每间每晚；餐饮、基础交通、杂项每成人每天。月租与水电每间每月。它们不是统计市场极值，不含国际路费、机场特定接送、远郊包车、独立登山铁路或船游。零票价只适用于名称与描述指定的公共区域，室内展览、登塔、付费活动、消费与交通不默认免费。

`durationRange` 是走马观花、推荐停留与仔细游览的规划假设；具体入口坐标为近似位置，并非导航级入口。山区、坡道、海岛另用 `accessNote` 说明。冰雪、日照、风力、海况和维护可能改变开放与交通；不以静态目录承诺运营。

## 官方目的地资料

| 目的地 | 核对入口与用途 | 访问日期 |
|---|---|---|
| 奥斯陆 | [VisitOSLO](https://www.visitoslo.com/)；官方目的地、歌剧院、雕塑公园、弗拉姆等目录。另参考 [2026 官方指南](https://www.visitoslo.com/contentassets/745397bd1ae445e69f840a4ebae65cdb/osloguide-eng-web.pdf)。 | 2026-09-22 |
| 卑尔根 | [官方景点目录](https://www.visitbergen.com/ting-a-gjore/attraksjoner) 与 [弗洛伊恩交通](https://en.visitbergen.com/ideas-and-inspiration/explore-bergen/floyen)。 | 2026-09-22 |
| 特罗姆瑟 | [官方景点交通说明](https://www.visittromso.no/travel/getting-around/sights) 与 [官方常见问题](https://www.visittromso.no/no/faq)。桥梁交通维护信息具有日期，不把旧封桥时段写成永久状态。 | 2026-09-22 |
| 哥本哈根 | [官方主要景点](https://www.visitcopenhagen.com/copenhagen/things-to-do/museums-and-attractions/top-attractions-copenhagen) 与 [城市中心指南](https://www.visitcopenhagen.com/copenhagen/areas/neighborhoods/what-to-see-and-do-in-the-city-centre)。 | 2026-09-22 |
| 斯德哥尔摩 | [Visit Stockholm 主要景点](https://www.visitstockholm.com/see-do/attractions/stockholm-highlights/) 与 [动物园岛指南](https://www.visitstockholm.com/see-do/attractions/district-guide-djurgarden/)。 | 2026-09-22 |
| 赫尔辛基 | [MyHelsinki 景点指南](https://www.myhelsinki.fi/en/see-and-do/sights) 与 [官方英文地图](https://materialbank.myhelsinki.fi/deployedFiles/42a7e8017ab9578358f118300f4720fb.pdf)。芬兰堡上岛交通与岛内馆舍需分开。 | 2026-09-22 |
| 罗瓦涅米 | [圣诞老人村官方目的地说明](https://www.visitrovaniemi.fi/santa-claus-village-at-the-arctic-circle/) 与 [文化场馆介绍](https://www.visitrovaniemi.fi/wp-content/uploads/ROVANIEMI-AUTUMN-2021-TIPS.pdf)。旧资料仅参考场馆身份，不沿用旧票价。 | 2026-09-22 |
| 塔林 | [Visit Tallinn 卡德里奥区](https://www.visittallinn.ee/eng/visitor/see-do/neighbourhoods/kadriorg) 与 [2025 博物馆地图](https://file.visittallinn.ee/a4zife/tmm2025-kaart-693x420-3mmbl-eng.pdf)。 | 2026-09-22 |
| 里加 | [LiveRiga 建筑目录](https://www.liveriga.com/en/36-architecture) 与 [黑头宫资料](https://www.liveriga.com/en/2023-house-of-the-blackheads)。 | 2026-09-22 |
| 维尔纽斯 | [Go Vilnius 地点目录](https://www.govilnius.lt/visit-vilnius/places) 与 [文化历史目录](https://www.govilnius.lt/visit-vilnius/places/culture-and-history)。特拉凯是远郊安排。 | 2026-09-22 |
| 华沙 | [Go To Warsaw 皇家之路](https://go2warsaw.pl/en/royal-route/)，核对皇家城堡、瓦津基公园与维拉努夫宫的城市布局。 | 2026-09-22 |
| 克拉科夫 | [Kraków Travel 官方目录](https://krakow.travel/en/?i=&source=782) 与 [旅游卡范围](https://krakow.travel/en/artykul/155/krakauer-touristenkarte)。旅游卡资料中的旧票价未采纳；瓦维尔、盐矿不按同一卡包含。 | 2026-09-22 |
| 布拉格 | [官方周末路线](https://prague.eu/en/home/discover/weekend-in-prague-treasures-at-every-turn/) 与 [查理大桥](https://prague.eu/en/objevujte/charles-bridge-karluv-most/)。 | 2026-09-22 |
| 维也纳 | [Vienna Info 皇家景点](https://www.wien.info/en/art-culture/imperial-sights) 与 [美泉宫](https://www.wien.info/en/art-culture/imperial-sights/schoenbrunn-palace-357558)。 | 2026-09-22 |
| 布达佩斯 | [官方世界遗产指南](https://www.budapestinfo.hu/en/world-heritage-sites-in-budapest) 与 [2026 春季博物馆指南](https://www.budapestinfo.hu/en/spring-exhibition-guide-in-budapest)。浴场收费和年龄规则待逐项核价，不承诺全包。 | 2026-09-22 |
| 苏黎世 | [Zürich Tourism 大教堂资料](https://www.zuerich.com/en/visit/attractions/grossmunster)。记录 2025–2029 修缮和露台访问限制，不保证全部观景空间开放。 | 2026-09-22 |
| 因特拉肯 | [官方山区指南](https://www.interlaken.swiss/en/experiences/mountains-panoramas) 与 [地区交通优惠说明](https://www.interlaken.swiss/en/info-service/guest-cards/interlaken-pass/discounts-interlaken/lake-brienz)。登山铁路季节运营与普通城区公交分开。 | 2026-09-22 |
| 雅典 | [This is Athens 古市集](https://www.thisisathens.org/antiquities/ancient-agora-stoa-attalos)。旧官方无障碍页面仍可能显示旧联票；本批未沿用其价格或联票承诺。 | 2026-09-22 |
| 圣托里尼 | [Visit Greece 火山口路线](https://www.visitgreece.gr/en/routes/santorini-sunset-overlooking-the-caldera) 与 [目的地介绍](https://www.visitgreece.gr/el/islands/aegean/santorini)。新卡梅尼需另订船，不用市内公路估算代替。 | 2026-09-22 |
| 马德里 | [官方光之景观目录](https://www.esmadrid.com/en/landscape-light-paseo-prado-and-retiro-park) 与 [王宫参观资料](https://www.esmadrid.com/en/tourist-information/royal-palace)。皇家厨房不默认含在普通王宫路线。 | 2026-09-22 |

## 图片来源与复核

已对 180 个城市 / 景点图像来源进行 Wikipedia API 批量条目存在性核查。英语无独立条目的地点改为已查明的精确 Commons 文件，而非使用城市泛图冒充：

- 卑尔根鱼市场：[Fisketorget3.jpg](https://commons.wikimedia.org/wiki/File:Fisketorget3.jpg)，由挪威语 Torget (Bergen) 条目主图确认。
- 特罗姆瑟极地博物馆：[Polarmuseet.jpg](https://commons.wikimedia.org/wiki/File:Polarmuseet.jpg)，由挪威语 Polarmuseet 条目主图确认。
- 奥纳斯山：[Ounasvaaratalvi.JPG](https://commons.wikimedia.org/wiki/File:Ounasvaaratalvi.JPG)，由芬兰语 Ounasvaara 条目主图确认；这是一张冬季照片，不承诺全年雪景。
- 伐木工人烛火桥：[Lumberjacks candle 2008.jpg](https://commons.wikimedia.org/wiki/File:Lumberjacks_candle_2008.jpg)，由芬兰语 Jätkänkynttilä 条目主图确认。
- 科伦迪文化之家：[Korundi House of Culture Rovaniemi 02.jpg](https://commons.wikimedia.org/wiki/File:Korundi_House_of_Culture_Rovaniemi_02.jpg)，Commons 文件说明明确地点。
- 吉斯巴赫瀑布：[Giessbach Fall.jpg](https://commons.wikimedia.org/wiki/File:Giessbach_Fall.jpg)，Commons 明示伯尔尼高地该瀑布，CC BY-SA 4.0。

本文件不写虚构本地图片路径。图片字段初始 `url:""`，下载成功且完成许可核对后由统一媒体管道注入真实资源。下载器需要保留作者、许可与来源，并按实际下载结果处理缺图。

## 当前覆盖边界

这 20 城暂新增景点与城市指南，未杜撰餐厅、酒店的库存或具体服务套餐。主页中的相关目录可在后续逐项核实后扩展。已有自动行程仍需结合真实预约时段、道路与票务服务；本批不宣称做到全球完整覆盖或实时导航。
