# 三份城市扩充包静态内容复核

复核日期：2026-09-24。仅阅读 JSON、坐标与来源说明，未启动应用、未运行应用测试。

范围：美洲 140 项、亚洲 99 项、欧洲与非洲 106 项，共 345 项。检查了 ID 与名称重复、推荐时长单位、坐标离城距离、接驳说明、自动安排标记，以及真实相关图片与精确图策略的冲突。

## 已在本人文件中修正

- `mombasa-coverage-mnarani`、`mombasa-coverage-colobus`、`arusha-coverage-tarangire`、`arusha-coverage-manyara` 原来文字已说明远郊，却仍允许自动安排。已关闭 `automaticPlanning`，补完整 `excursion.transportNote`。
- `essaouira-coverage-had-dra`、`hurghada-coverage-somabay-kite` 已关闭自动安排，但缺结构化远郊信息，现补齐。欧洲与非洲包中直线距中心超过 20 公里的项目均明确关闭默认自动加入；说明中的公路距离与往返时间不以直线距离替代。
- 拉巴特追加圣彼得主教座堂，赫尔马努斯追加 Danger Point 灯塔，补偿旧场馆与附属服务体验的语义重叠。均有官方来源、独立照片与分钟制 `durationRange`。
- `ex-depth-marrakech-hammam` 原图的 Commons 描述中出现 “map of hammams”，触发导入器的地图过滤，虽然实际是建筑照片。已改为另一张可导入的真实宫殿浴室照片，明确不是 Les Bains de Marrakech 运营商设施。

## 已补齐的交通与位置说明

以下亚洲远郊条目已补充 `accessNote`：列明自驾、包车或可用公共交通方式、单程和往返时间，并明确属于规划估计，按酒店位置、路况与当日班次核时核价。游览及特殊末段接驳另计，保持 `automaticPlanning:false`：

- 天津：`tianjin-coverage-huangyaguan`（直线约 125 公里）、`tianjin-coverage-dule`（104 公里）、`tianjin-coverage-panshan`（108 公里）。
- 敦煌：`dunhuang-coverage-yulin-caves`（110 公里）、`dunhuang-coverage-suoyang`（131 公里）、`dunhuang-coverage-xuanquan`（68 公里）。
- 延安：`yanan-coverage-zhongshan`（63 公里）、`yanan-coverage-huangdi`（112 公里）、`yanan-coverage-qiankun`（85 公里）。
- 遵义：`zunyi-coverage-shuanghe`（66 公里）、`zunyi-coverage-qingxi`（89 公里）、`zunyi-coverage-zju` 与 `zunyi-coverage-tea-memory`（约 53 公里）。
- 张家界：`zhangjiajie-coverage-jiutian`、`zhangjiajie-coverage-helong`；甲米：`krabi-coverage-emerald-pool`。上述距离仅用于发现需单独交代交通的项，不是可直接展示的公路距离。

武陵源地质公园博物馆也已关闭默认自动加入，说明与武陵源同片区景点组合。美洲包 `san-francisco-coverage-asian-art` 的位置说明及费用注释均改为“与旧金山现代艺术博物馆是不同场馆”，不再称两馆相邻。

## 其它观察

本批新增条目未发现重复 ID、完全相同英文名称的旧馆重复项、经纬度越界或明显置于另一国家的坐标。所有 `durationRange` 推荐值都与 `durationHours × 60` 一致，未发现剩余小时误当分钟。未发现 `nearby` / `related-theme` 仍使用精确图片限定策略的新增项。这里只是静态合理性复核，不表示逐个坐标已核验到入口米级精度。

美洲远郊项目虽没有统一 `excursion` 对象，但都有 `automaticPlanning:false` 和具体接驳文字，不应仅因缺对象判为内容错误。亚洲两座美术馆不同馆址、巴西/阿根廷瀑布的跨境不同入口、博物馆及独立主题场馆均保留为不同的可选行程，不是拆分同一游览票凑数。
