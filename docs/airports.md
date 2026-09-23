# 全球机场与机场城市数据库

数据来自 [OurAirports 官方下载页](https://ourairports.com/data/) 的公开领域 CSV，字段定义见 [官方数据字典](https://ourairports.com/help/data-dictionary.html)。机场坐标、名称、行政区和定期航空服务标记直接保留来源信息。原始网站每天更新；本应用的常规维护每七天检查一次，用户也可手动刷新。

2026-09-22 实际下载并校验：

| 内容 | 数量 |
| --- | ---: |
| 来源机场记录 | 86,116 |
| 纳入的机场与水上机场 | 49,287 |
| 机场城市 / 无市名机场地点 | 34,895 |
| 来源国家 / 地区代码 | 239 |
| 标记有定期航空服务的机场 | 4,223 |
| 标记有定期航空服务的城市 / 地点 | 4,136 |
| 无 municipality、单独展示为机场地点 | 3,500 |
| 映射到现有精选目的地的机场组 | 105 |

纳入类型为 `large_airport`、`medium_airport`、`small_airport`、`seaplane_base`。来源内 `closed` 13,546、`heliport` 23,220、`balloonport` 63 条单独计数并排除。`small_airport` 等类型并不意味着可购买商业客票，`scheduled_service` 也是来源标记，不是当日航班时刻表。

## 文件与接口合同

- `data/airports.json`：`{ version, generatedAt, source, airports }`，每个机场有稳定 `airport-来源ID`、名称、IATA/ICAO、类型、是否有定期服务、坐标、机场组 `cityId`、来源与官网链接。
- `data/airport-cities.json`：`{ version, generatedAt, source, cities }`，每个城市有稳定 `aircity-...`、市名、国家 / 地区、行政区、机场代码及 ID 列表、定期服务标记和数据来源。
- `data/airport-city-links.json`：经来源核对的市名别称与城区机场映射。机场组 `curatedCityId` 指向已有详细目的地；不会因为旅游目的地共用入口机场就把它们合并。
- `data/airport-maintenance.json`：最近尝试、最近成功、来源行数、过滤统计及失败说明。

城市按“国家 / 地区代码 + 一级行政区代码 + 规范化 municipality”聚合；同名但不同州的城市保持独立。无市名记录以来源机场 ID 作为独立地点，`nameKind: 'airport'`。同组机场按定期服务、规模、IATA 排序，主机场坐标用于展示，明确 `coordinateBasis: 'airport'`，不冒充市中心。

北京 PEK / PKX、上海 PVG / SHA、伦敦 LHR / LGW / LCY 可关联到对应详细城市。成田、纽瓦克、桃园、雪邦、内夫谢希尔保留独立机场城市；马富施不会因共用 MLE 被合并为马累，会安不会因共用 DAD 被合并为岘港。

新增条目标注 `coverage: 'airport-only'`，不填入虚构的食宿价格、景点、照片、实际航线或票价。目的地之间的规划连线表示计划访问顺序，不代表存在直飞航班或已订机票。

美国详细城市的自动名称匹配还核对州别与机场距离（120 公里内），避免把缅因州的 Portland 或西弗吉尼亚州的 Charleston 合并到另一个州的同名旅游城市。人工核对的机场代码别名优先。华盛顿特区通过 DCA 的 Washington 组关联；IAD 作为服务机场列在城市内，Dulles 机场所在地保留为内部交通资料。

## 2026-09-23：城市选择与机场库存分离

所有公开城市选择入口及地球默认点位只收录有旅行内容的目的地，由 `isTravelDestination` 统一筛选。`airport-only`、机场名称和兼容别名不再参与城市、国家或字母列表，也不再提供“显示全部机场城市”的开关。维护脚本下载新机场不会自动创建可选的空白旅行城市。

机场库存继续用于交通查询及旧项目；新增详细城市通过经核对的机场代码关联。运行时 `airportCityAliases` 把原有 `aircity-*` 项目键解析到完整城市资料，保留用户的预算及行程设置；别名不会重复出现在国家自动规划中。尚未制作完整资料的真实城市不会伪装为已有内容的目的地。

本批补充南昌、遵义、延安、天津。遵义茅台机场位于仁怀，关联原机场组只为兼容旧项目，不代表机场就在遵义城区；接驳须另外预留。四城同时接入已有铁路预算网络，其中延安高铁已于 2025-12-26 开通，核验依据为[中国铁道科学研究院转引国铁集团公告](https://www.rails.cn/content.php?contentid=68059)。铁路时长与费用仍是规划估算，不代表实际直达车次。

## 更新与验证

```powershell
node scripts/update-airports.mjs
node scripts/update-airports.mjs --if-stale
node scripts/update-airports.mjs --python-network
node --test tests/airport-data.test.mjs
```

`--if-stale` 在最近一次成功未超过七天时保留快照；`--python-network` 可在 Node 未使用 Windows 系统代理的环境下使用 Python 标准库网络传输。默认 Node 请求超时后也会尝试该传输。下载有时间与大小上限。

三个 CSV 全部通过字段、行数、重复 ID、坐标和关联校验后才写入临时快照并替换。若下载、解析或替换失败，保留旧快照与最近成功时间；第二个文件替换失败时回滚第一个。维护锁阻止重复请求；崩溃遗留的死进程锁可以恢复，存活进程的锁始终保留。

现有测试覆盖带引号 / 换行 CSV、北美 `NA`、机场类型筛除、跨州同名城市、无市名与缺失坐标、稳定 ID、共用入口机场隔离、失败保留、替换回滚、七天检查和崩溃锁恢复。

## 全球地图地区代码

`shared/country-codes.mjs` 使用 [联合国 M49 官方表](https://unstats.un.org/unsd/methodology/m49/overview/) 的 248 项 ISO alpha-2 / numeric 对照，并保留已有 TW → 158，合计 249 项。数字代码始终保留三位。OurAirports 的非标准地区代码 `XK`、`XP` 不编造 ISO 数字映射；这些地点仍可以通过机场坐标显示，国家多边形填色取决于底图覆盖。
