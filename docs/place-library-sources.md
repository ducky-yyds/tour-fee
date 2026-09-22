# 城市地点补充库：来源、维护与范围

`data/place-expansion/osm-places.json` 是从 OpenStreetMap 选取和整理的地点数据库，
与 `data/expansion` 的人工目的地介绍、编辑预算分开维护。

## 数据来源与许可

- 来源：[OpenStreetMap](https://www.openstreetmap.org/copyright)，署名 **© OpenStreetMap contributors**。
- 派生地点数据库按 [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 提供；分发该数据库或据此修改的数据库时保留同许可及署名。
- 每个地点保留 OSM 对象 URL、对象类型与 ID、关键原始标签、实际获取时间和源数据时间戳。可从公开仓库取得机器可读 JSON，界面应链接署名与许可。
- OSM 中的官网地址是贡献者填写的标签，不代表本站已经独立核验经营者；`websiteVerification` 明确记录这一点。
- 英文 Wikipedia 条目仅用于定位相应地点的实景图。照片不是 ODbL 数据的一部分，下载和展示仍须遵守每张照片自己的版权许可并保留作者署名。没有精确条目时保留 `noArticle:true`，不拿其他城市的照片冒充。

官方说明：[OSM 版权页](https://www.openstreetmap.org/copyright)、
[Overpass 公共实例列表](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances)、
[Overpass 使用与配额](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)。

## 采集范围

脚本合并 `data/cities.json` 和 `data/expansion/*.json` 中的维护城市，排除只有机场信息的节点。
默认在每城参考坐标周围 6 公里查找具名街区、广场、步行街、市场、公园、花园、
博物馆、艺术空间、历史地点、观景点与大型购物场所，每城保留最多 30 个候选。
搜索范围可能包含城市边缘或邻近街区，不代表行政边界，也不代表城市所有可游览地点。
离岛、很大的城市和远郊项目需要后续扩大指定区域或人工添加，不能宣称已穷尽。

筛选会排除明确标记为私有、禁止进入、仅限顾客、停用、拆除、施工或关闭的对象，
以及名称只有“商店”“市场”“Park”等通用类别词的记录。
没有访问标签不等于保证开放。名称、英文名、维基条目以及近距离同名对象用于避免和人工资料重复；
OSM 节点、面及关系之间按名称和 Wikidata 去重；维基页内锚点先去掉，少量已确认的别名仍需近距离坐标匹配。
每个类别内部先按资料完整度排序，再轮流选取不同类别，避免全部被一种设施占满。
坐标可能是区域中心，导航入口需要另行确认。中文名缺失时保留源名称，不编造译名。

## 时间与费用语义

- 建议停留时间为按地点类型给出的编辑估计，不是官方时长或已验证开放时段。
- 默认 `automaticPlanning:false`，让用户明确选入后再参与行程；`visitRole` 标示街区或可选探索地点。
  其中明确标记为 `place=quarter/neighbourhood` 或 `highway=pedestrian`，且没有收费、私有、室内、建筑或隧道标记的户外街区/步行街可设为 `true`，以 45–90 分钟的街区漫游参与空档补齐。公园、博物馆、购物场所和其他未核实空间不因此自动加入。
- `fee=no` 才使用 `price.type:'free'`，仍提示该 OSM 标记未向经营者复核。
- 街区、公共街巷及广场可用 `estimate` 零门票，但仅限户外公共范围，室内场馆和消费不包含。
- 其他缺乏可靠费用资料的地点全部使用 `price.type:'missing'`。其中 `low:0/high:0` 只是结构占位，**不能在界面或总预算中解释为免费**。
- `sourceCheckedAt` 是数据实际获取日期，`price.checkedAt` 保持空值；数据抓取不能伪装成票价验证。

## 运行与持续维护

只依赖 Python 3 标准库，在仓库根目录运行：

```powershell
py -3 scripts/update-place-library.py
py -3 scripts/update-place-library.py --cities paris,london --refresh
py -3 scripts/update-place-library.py --proxy http://127.0.0.1:10809
py -3 scripts/update-place-library.py --cache-only
```

默认使用公共实例 `https://overpass-api.de/api/interpreter`，每次只发一个请求，
单次可合并两个城市的有限查询框以减少往返，仍按各城市半径独立筛选和缓存；`--batch-size 1` 可改回单城。
请求间至少 3 秒，异常退避至少 30 秒；429 有数字 `Retry-After` 时按该值等待，最长 5 分钟。
每个请求组至多尝试 2 次；合并查询超时会回退单城。拒绝访问时保留已有数据，
不通过轮换身份或端点绕过限制。可用 `--endpoint` 显式配置自己的兼容实例。
原始响应与运行摘要位于 `artifacts/place-library-cache/`，成功响应缓存 30 天。
每完成一个城市都会原子写入输出；中断或网络失败不会清空此前完成的城市。
运行时的日期与完整获取时间以 UTC 记录，和用户所在地日历日期可能相差一天。

默认每次运行最多发 80 个网络请求；缓存重用不产生请求。
首次建立库需要更多城市时，可明确增加 `--max-requests`，例：

```powershell
py -3 scripts/update-place-library.py --max-requests 160
```

建议按月维护，按城市分批刷新，查看 `artifacts/place-library-cache/last-run.json` 的失败与延期项。
网站读取已生成的静态数据，不应让每个访客直接调用公共 Overpass。
实际商用或更大规模的持续更新应改用自建/付费实例或地区数据摘录，按所用服务的当前规则设置预算与速率。

## 首次资料快照（2026-09-23，中国时间）

本次在全部 127 座维护城市生成 3,653 个补充地点，按不同类别轮流选取；其中街区 473 个、
街巷与广场 415 个、市场 409 个、公园与花园 463 个，其余为文化、艺术、商业及观景地点。
536 个公共街区或步行街符合自动补齐的窄范围条件，864 个地点带英文 Wikipedia 文章线索，
后者不等于照片已经下载或该地点费用已经核实。

费用状态为：882 个仅户外范围零门票估算、73 个来源标注 `fee=no`、2,698 个费用待补充。
118 座城市达到本次每城 30 个候选上限；巴厘岛 10、兰塔岛 13、甲米 11、兰卡威 23、
陵水 5、马富施 17、纳克索斯 21、维克 10、万宁 3。较少的数量反映当前查询范围和资料筛选，
不能解释为当地只有这些地点。

网络采集后对 127 城做了一次完整缓存重放，以纳入人工资料去重和最新分类规则；
最终失败、延期均为 0。实际 UTC 获取日期保存在每条数据中。
本地维护摘要位于 `artifacts/place-library-cache/final-coverage.json`，
网络运行与缓存重放的摘要分别保存在 `bootstrap-network-run.json` 和 `last-run.json`。
