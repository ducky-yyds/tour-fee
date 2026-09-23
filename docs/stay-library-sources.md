# 全球住宿补充库

`scripts/update-stay-library.py` 维护 `data/experience-expansion/stays-global.json`，
目标是让每座已维护旅游城市在原有住宿之外补足至少 5 家具名住宿。
这是一份可核对名称和位置的住宿目录，不是实时房态、已验证经营者名单或酒店报价库。

## 来源与范围

- 自动资料来自 [OpenStreetMap](https://www.openstreetmap.org/copyright)，通过串行的公共 Overpass 查询取得。
- 只选 `tourism=hotel/guest_house/hostel` 且有具体名称的对象；排除明确停用、拆除、施工、关闭、私有或禁止访问的标记。
- 默认在城市参考中心 10 公里内查找，可用 `--radius 15000` 重新处理稀疏城市。范围并非城市行政边界。
- 地点按名称、英文名、维基文章及相近坐标去重；保留已人工维护的住宿，优先选择官网、地址或实景文章线索较完整的补充资料。
- 即使没有关闭标签，也不能据此确认当前营业；自动资料统一标记 `operatingStatus:not-independently-verified`。
- `data/stay-library-exclusions.json` 保留人工发现的资格限制、改建或用途冲突对象及来源，也排除已确认指向品牌或同名异地建筑的图片文章；这些记录须在获得新的官方资料后人工更新。
- 地址仅拼接原有 `addr:*` 标签，不补造街道或门牌；`addressTags` 保留原始字段，坐标可能是区域中心而非入口。
- 经营者、官网和星级仅在源标签存在时保存。`starsSourceTag` 不是本站认证星级，`websiteVerification` 明确表明官网标签未经独立核验。

OSM 原始标签说明：[酒店](https://wiki.openstreetmap.org/wiki/Tag:tourism%3Dhotel)、
[民宿和小型旅馆](https://wiki.openstreetmap.org/wiki/Tag:tourism%3Dguest_house)、
[青年旅舍](https://wiki.openstreetmap.org/wiki/Tag:tourism%3Dhostel)、
[星级标签](https://wiki.openstreetmap.org/wiki/Key:stars)。

## 预算与服务

自动住宿的三档选项分别复制该城市 `daily.lodging` 的经济、舒适和高端编辑预算，
`priceBasis:city-daily-lodging`，`type:estimate`，`checkedAt:null`。
它们只是按一间一晚预留成本，**不表示这家住宿提供这些价位，也不是房型或套餐**。
青年旅舍可能按床位计价，是否有整间客房、容量和实际价格均需向经营者询问。

不从住宿类型推断早餐、泳池、私家海滩、免费接送、房型、入住人数或包含服务。
`includes` 留空，用户取得具体日期报价后应替换预算，并核对税费和取消条款。
`checkedAt/sourceCheckedAt` 是资料取得日期；不等于确认房价或房态的日期。

## 图片与许可

- `imageArticle/article` 只记录 OSM 提供的英文 Wikipedia 对应文章；页面可能介绍同一建筑的旧名称，展示前仍应核对照片主体。
- `imageSource` 可记录对应 Commons 文件，照片必须另外核验许可；不能因为地点数据开放就直接使用经营者照片。
- OSM 的普通 `image` URL 只作为 `imageSourceHint` 保存，标记许可未核验，不直接发布。
- 没有对应实景图时保留 `noArticle:true`，不使用城市风景假冒该住宿。
- OSM 派生住宿数据按 [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 提供，保留 **© OpenStreetMap contributors** 署名和各对象的源链接。它与图片许可不同。

## 运行和续传

```powershell
py -3 scripts/update-stay-library.py
py -3 scripts/update-stay-library.py --proxy http://127.0.0.1:10809
py -3 scripts/update-stay-library.py --cities wanning,lingshui --radius 15000
py -3 scripts/update-stay-library.py --cache-only
py -3 scripts/update-stay-library.py --cities paris,london --refresh
```

仅依赖 Python 标准库；默认每次合并最多 3 个有界城市查询，网络请求仍严格串行。
请求之间默认至少 4 秒，失败退避至少 30 秒，429 尊重数值 `Retry-After`，每组至多尝试两次。
不轮换身份绕过拒绝，合并请求超时退回单城。成功响应缓存 30 天，每完成一城就原子保存目录和进度。

`artifacts/stay-library-cache/last-run.json` 记录已完成城市、不足 5 家的城市及失败/延期项；
原始缓存保留查询、源时间戳与真实 UTC 获取时间。网站只读取预生成目录，不让访客请求公共接口。
默认单次最多 80 个网络请求，首次导入可明确提高 `--max-requests`；常规更新宜按月分批进行。
商用或更大规模维护应使用自建或付费实例，遵守[公共实例政策](https://wiki.openstreetmap.org/wiki/Overpass_API)
和[资源使用说明](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)。

如需人工补齐稀疏城市，可将按同一体验 schema 整理、具有官方来源的住宿放入
`data/stay-library-manual.json`。采集器会优先保留这些条目，并在输出中合并；
人工条目也不能把城市编辑预算标成酒店报价。

## 首次维护快照（2026-09-23）

已在原有 99 家住宿基础上补充 536 家，使 127 座城市各有 5 家、总计 635 家具名住宿。
新增资料包括 509 家酒店、17 家青年旅舍、10 家民宿或小型旅馆；486 条带网站标签，485 条带地址标签。
124 条有筛选后的英文 Wikipedia 图片文章，另有 20 条普通图片 URL 线索尚未核验许可，不能直接发布。

新增 536 家的当前经营状态都仍标为未独立核验，不能把目录覆盖解释成已经逐店确认营业。
1,608 个预算选项均是城市住宿三档预留，不是实际房价。本次原始查询已满足数量目标，未为凑数扩大范围或虚构住宿。

完成网络采集后，使用全部缓存重新生成了 127 城资料，应用经营限制排除、文章纠错、
名称词序去重及马富施本岛边界；重放没有网络请求，失败、延期、不足 5 家的城市均为 0。
详情见本地 `artifacts/stay-library-cache/final-coverage.json`，
网络及重放日志分别为 `bootstrap-network-run.json` 和 `last-run.json`。

住宿卡片的主简介仅呈现源坐标可支持的位置、地址中的街道或区域，以及与城市参考中心的距离。
地图来源和经营核验状态另存 `verificationNote`，供详情面板展示；不会由地图标签推断早餐、设施或房型。

## 原有住宿的实景图片来源

`data/experience-image-sources.json` 为原有 99 家住宿补充准确的英文 Wikipedia 物业条目或 Commons 文件名。
2026-09-23 已逐条查询英文标题，并对未匹配项检索 Commons；46 家取得准确来源（21 个物业条目、25 个具体文件）。
其余 53 家暂不指定图片，不用品牌文章、同名异地酒店、酒店经理肖像、餐点或城市远景代替物业实景。
涉及更名时核对相同物业，例如大澳文物酒店对应 Old Tai O Police Station，阿姆斯特丹 Hoxton Lloyd 对应 Lloyd Hotel。
萨赫酒店的百科首图为标志，改用其维也纳酒店休息厅的具体照片；成都博舍不使用同名迈阿密 The Temple House 条目。

映射仅提供图片身份线索。下载器仍须读取每张图片的许可、作者、拍摄时间和来源链接；
旧照片不证明现有装修、设施开放情况或所选房型。
原始检索结果保存在本地 `artifacts/stay-image-research.json` 和 `artifacts/stay-commons-research.json`，
文件类别也用于确认简短说明的物业归属，例如 `Haupttrakt Kempinski Malta.JPG` 属于 Kempinski Hotel San Lawrenz。
