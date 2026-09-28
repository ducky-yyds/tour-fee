# 本地完整资产与正式部署

本地原件、完整目录和运行数据库是主版本。GitHub Pages 只是根据已提交公共内容生成的预览，不承担原件保管和唯一数据维护。当前免费方案由本机执行完整维护；本机关机时暂停，恢复后续跑。迁移到常开服务器后使用同一命令调度。

## 本地目录

- `storage/originals/`：不可变原文件、现存最高质量副本、来源、作者、许可、哈希和归档缺口。外链及网页缩略图不能替代原件。
- `data/`：城市、景点、体验、食物、住宿、交通、价格参考、来源、更正与扩充包。目录主要是 JSON，不能只备份 SQLite。
- `data/travel.sqlite`：已采集的成功快照、价格观察历史和来源状态。使用 WAL；备份命令调用 SQLite 一致性备份接口，不直接复制正在使用的主文件。
- `storage/backups/`：按 SHA-256 去重的数据对象与版本清单。原件和 SQLite 已被 Git 忽略，Git 仓库不是完整备份。
- `public/images/`：可重新生成的网页图片；正式服务器通过 `MEDIA_ROOT` 指定这个目录的位置。原件归档不作为公共文件目录。

原件指来源实际提供的原始文件，JPEG 原件仍原样保存为 JPEG。历史缩略图无法通过放大或格式转换恢复细节。原件不可取得的条目保留缺口，归档报告不能将其计作完整原件。压缩脚本在替换网页图片前先保全旧字节，随后记录新派生版本。

## 归档与完整迁移

从项目目录执行，要求 Node.js 24+、Python 3。维护依赖记录在 `requirements-maintenance.txt`：

```powershell
py -3 -m pip install -r requirements-maintenance.txt
npm run archive:assets -- --inventory
npm run archive:assets -- --download --limit 200
npm run archive:assets -- --verify
npm run build
npm run archive:snapshot -- --label before-deployment
```

`--download` 从缺少原件的条目续跑，不覆盖已有原件。命令输出快照清单的绝对路径。下例将清单路径替换为实际输出：

```powershell
npm run archive:verify -- --manifest storage/backups/snapshots/实际快照.json
npm run archive:export -- --manifest storage/backups/snapshots/实际快照.json --output storage/exports/正式迁移包
```

迁移包是独立目录，包含恢复脚本、代码/锁文件、全部目录数据、SQLite 一致性快照、图片原件与网页资源、哈希清单。已有生产构建也会纳入，清单的 `builtFrontendIncluded` 表示是否包含。复制整个目录到服务器即可；不能只复制 `manifest.json`。包内不保存密码、密钥和浏览器私人项目。

在迁移包目录恢复到一个**不存在的新目录**：

```sh
node restore.mjs verify --manifest manifest.json --objects .
node restore.mjs restore --manifest manifest.json --objects . --target /srv/tusuan-new
cd /srv/tusuan-new
node --env-file-if-exists=.env server/index.mjs
```

包含生产构建时，只需已安装 Node.js 24 即可运行恢复的版本；数据和资产恢复本身不需要访问原始网站。需要重新构建或运行采集维护时，再联网安装依赖：

```sh
npm ci
python3 -m pip install -r requirements-maintenance.txt
npm run build
npm start
```

恢复命令验证全部文件的大小、哈希、JSON 格式和 SQLite 完整性，再原子完成目标目录；不覆盖已有项目。失败会保留 `.incomplete-*` 目录便于排查。快照按不可变对象去重，但它仍是本地副本；需要独立设备备份时复制整个迁移包。

## 配置与维护

参考 `.env.example` 设置运行环境：`TRAVEL_DB_PATH`、`ASSET_ARCHIVE_DIR`、`PROJECT_BACKUP_DIR` 和 `MEDIA_ROOT` 都可迁移到服务器持久磁盘。`VITE_MEDIA_BASE_URL` 是可选的公开派生图片地址，修改后需重建前端。环境变量或 `.env` 中的真实密钥不进入归档与 Git。

```powershell
npm run maintain:local -- --publish
powershell -ExecutionPolicy Bypass -File scripts/schedule-updates.ps1 -Install -Time 07:30
```

维护依次保全图片、发现目的地、刷新已接入公共来源、合并已整理的内容、归档新图片、补下载原件、审计、保存公开来源快照与完整备份。发现未提交的人工内容修改时，先保全完整快照，再暂停数据改写；提交这些修改后，下次维护可继续。只有审计和预览构建通过才提交公共数据并推送，已有暂存内容不混入自动提交。运行日志与断点保存在 `storage/maintenance-state.json`。仅整理本地内容可加 `--offline`；不加 `--publish` 时仍保存完整快照。

Windows 调度要求当前账户已登录；离线期间不声称持续抓取。正式 Linux 服务器可用 cron：

```cron
30 7 * * * cd /srv/tusuan && /usr/bin/node --env-file-if-exists=.env scripts/maintain-local.mjs --publish >> /srv/tusuan/storage/maintenance.log 2>&1
```

不要同时启用旧版价格更新定时任务和完整维护任务；`AUTO_UPDATE=0` 为默认。GitHub 每日任务只检查来源可访问性，结果不等于价格或内容已经核验；预览构建不再自行抓取并丢弃唯一的数据成果。

## 换域名时的个人数据

旅行项目、足迹、旅居偏好在浏览器中，不在服务器 SQLite。请先在原网站导出完整个人工作区，在新网站导入。此方式保留多个旅行项目、活动项目及各页面设置；跨域网站不能自动读取原域名的浏览器存储。个人导出文件不应放入公开仓库或 Pages 目录。

## 完成口径

归档检查区分“所有现存文件已保存”和“所有原件已恢复”；全球覆盖报告区分“已发现”“待补齐”和“内容达标”。维护任务成功、网页有缩略图，均不能代替这两个完成标准。
