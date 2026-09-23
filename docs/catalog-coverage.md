# 目录覆盖审计

运行 `npm run audit:catalog` 更新 `data/catalog-coverage.json`。图片或数据批次仍在写入时，先等待任务完成，再生成最终快照。

`cityMinimumCoverage` 检查至少 127 个详细目的地，并逐城列出特色食物与酒店数量；每城各不少于 5 项。食物按共享定义的 `cityIds` 归属统计，住宿通过统一体验目录加载，包含 `data/experience-expansion/stays-global.json`。达到数量要求不代表覆盖全城、核实营业或拥有可订房态；城市住宿预算仍是估算。

`mediaCoverage.manifest` 只统计 `media.json` 中直接属于该项目 ID 的记录。`mediaCoverage.runtime` 使用和城市目录相同的图片解析规则，包含项目自带图片、相关地点引用及主题插画。两套数据同时保留，运行时补图不会覆盖原始缺图事实。

图片分为：

- `exact-place`：标明对应地点的照片。
- `nearby`：周边或相关地点照片，不能视为商家、房间或食物本身的外观。
- `illustration`：主题插画，有图可展示，但不计入实拍数量。
- `existing-photo`：旧记录未指定范围，保留为既有照片，不自动认定为新核验的精确地点照片。

`photos` 和 `missingPhotos` 保留为原始映射的实拍覆盖与缺失清单；插画不增加实拍数。`cardsWithImage` / `missingImageIds` 说明是否有可展示图片。因此，标注 `needs-food-photo` 的食物即使还在等待准确食物照片，也可以通过插画成为有图卡片；`foodCoverage.awaitingDishPhoto` 与 `missingCardImages` 分开报告。

`imageFileCoverage` 检查目录解析出的本地图片文件。失效的直接图片不会被审计器偷偷替换为插画，缺失 URL 和受影响项目会记录下来；远程图片只单列为未联网确认，审计不下载图片。`scopeCounts` 只统计文件存在或具有有效远程 URL 的卡片，`declaredScopeCounts` 则保留所有声明的图片范围，包括缺失文件。

计数单位是城市、地点、餐宿体验和共享食物卡片，不是独立图片文件数。同一张插画可用于多个项目，不能把卡片覆盖数理解为拍摄数量。
