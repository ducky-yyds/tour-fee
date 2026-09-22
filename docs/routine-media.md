# 日程场景照片

日程的早餐、用餐、交通和住宿图片用于帮助识别活动类型，全部明确标注“场景参考图”。它们不表示已确认的航班、车辆、餐厅、菜品、房态或酒店预订。2026-09-23（北京时间）通过 Wikimedia Commons 的文件信息 API 核对摄影作品、作者及许可证，下载官方 960 像素缩略图；未生成图像或替换原有目的地图片。

| 用途 | 作者 | 许可证 | 原始作品页 |
| --- | --- | --- | --- |
| 早餐：咖啡与可颂 | www.Pixel.la Free Stock Photos | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | [Coffee-morning-breakfast-croissant](https://commons.wikimedia.org/wiki/File:Coffee-morning-breakfast-croissant_(24300690486).jpg) |
| 餐饮：餐桌与菜肴 | Tisa0603 | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | [Foods on table](https://commons.wikimedia.org/wiki/File:Foods_on_table.jpg) |
| 飞行：机翼与云层 | Tobias1984 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Airplane wing sky and clouds](https://commons.wikimedia.org/wiki/File:Airplane_wing_sky_and_clouds.jpg) |
| 接驳、公路：机场巴士 | CAPTAIN RAJU | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | [Airport e-Shuttle bus](https://commons.wikimedia.org/wiki/File:Airport_e-Shuttle_bus_(Roma_Ciampino_Airport)_in_2026.02.jpg) |
| 铁路：站台上的列车 | Syced | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | [N700 Shinkansen Nozomi](https://commons.wikimedia.org/wiki/File:N700_Shinkansen_Nozomi.jpg) |
| 船程：海面上的渡轮 | Mertie . | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Sydney Ferry Narrabeen](https://commons.wikimedia.org/wiki/File:Sydney_Ferry_Narrabeen_travelling_to_Manly_on_Sydney_Harbour_(cropped).jpg) |
| 住宿：客房与床铺 | JIP | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | [Hotel room interior at hotel Radisson Blu Oulu](https://commons.wikimedia.org/wiki/File:Hotel_room_interior_at_hotel_Radisson_Blu_Oulu.jpg) |

交通与住宿照片拍摄于特定地点，仅作为通用场景；逐图 `description` 记录具体拍摄对象。照片保留原许可证，界面会按容器裁切；CC BY-SA 照片的裁切展示沿用该许可证。UI 应提供作者、原始文件页与许可证链接，图像修改说明为 `image.modifications`。界面作者简写通过 `creditOriginal` 保留完整名字，JSON 也保留原始署名。

## 文件和接口

- `public/images/routine-*.jpg`：7 张缩略图，总计约 1.23 MiB。
- `data/routine-media.json`：完整作者、来源、许可、拍摄时间、核验时间、字节数与场景说明。
- `src/itinerary-media.mjs`：`ROUTINE_MEDIA` 导出图片对象；`getItineraryMedia(item, city)` 返回 `{ image, alt, label, isReference, kind }` 或 `null`。
- 图片 `url` 使用 `/images/...`，通过现有 `<Photo>` / `assetUrl` 自动适配 `/tour-fee/`，不会在静态 Pages 请求根目录图片。
- `scripts/fetch-routine-images.py`：仅用 Python 3 标准库重新查询许可并下载官方缩略图；不进行图像编辑。运行 `py -3 scripts/fetch-routine-images.py`（Linux/macOS 用 `python3`）。

`arrival-ready` / `journeyPhase: arrived` 优先用当地城市图片；`routineType: citywalk` 优先用 `suggestedPlaces` 的实际景点图片，其次对应交通终点的景点图和城市图，并标“周边景点参考图”或“城市参考图”。缺图则返回 `null`，不会拿别的城市充数。

酒店或餐馆原有 `imageRef` 可能只是附近地标。只有照片的 `subjectId`、`experienceId` 或 `entityId` 明确匹配经营者 ID，才以“地点资料图”展示；其他情况使用带标签的通用参考图。没有实际交通方式的抵达提醒不会默认变成飞机图。
