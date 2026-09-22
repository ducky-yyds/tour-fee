# 数据维护

`npm run update:data` 抓取六个公开来源：Frankfurter 参考汇率、Tokyo Metro 地铁票、东京塔门票、埃菲尔铁塔门票及一兰涩谷/京都河原町两家门店菜单。每个来源最多尝试两次，每次超时 18 秒；失败或格式不确定保留上次成功快照，HTTP 403 不尝试绕过。当前埃菲尔页面会拒绝程序访问，目录继续使用人工核验价格。

数据库为 `data/travel.sqlite`。`snapshots` 保存最后成功值，`observations` 保存所有抓取结果，`source_status` 区分最近尝试与最近成功时间。东京塔/埃菲尔铁塔成功快照直接覆盖 API 的对应门票；两家一兰快照覆盖 `priceSamples` 消费样本。地铁票单独展示为 `city.transportReference`，不冒充日常交通平均价。编辑食宿和房租区间仍需人工维护。

Windows 每日任务：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/schedule-updates.ps1 -Install -Time 07:30
Get-ScheduledTask -TaskName TusuanTravelDataDaily
Get-ScheduledTaskInfo -TaskName TusuanTravelDataDaily
```

任务以当前 Windows 账户运行；电脑须开启且账户须登录。安装成功会写 `data/schedule.json`，记录安装时间、时区和任务名称。这是安装记录，用户此后停用或删除任务不会自动改写该文件。当前状态可由上述命令核对。最后一次任务返回 1 表示至少一个来源失败；其他成功来源仍已更新。

不使用操作系统任务时，可以为 Node 服务设置 `AUTO_UPDATE=1`。服务每 15 分钟检查一次，距离上次更新满 24 小时才运行；可用 `UPDATE_INTERVAL_HOURS` 改为 1–168 小时。默认关闭内置调度，避免与 Windows 任务重复。SQLite 中有带 10 分钟失效时间的排他锁，手动与定时更新同时触发时仅一个实例抓取。

Linux cron 示例：

```text
30 7 * * * cd /path/to/tusuan && node scripts/update-data.mjs >> update-data.log 2>&1
```

`GET /api/data-status` 返回来源状态、近期历史、调度配置与 Windows 安装记录；`GET /api/catalog` 每次读取最新成功快照，前端重新加载后使用最新数据。参考汇率超过 4 天标记 stale，抓取失败不会改写旧价格的核验日期。没有公开写入接口。
