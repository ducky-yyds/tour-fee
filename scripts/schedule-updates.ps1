param(
  [switch]$Install,
  [string]$Time = '07:30'
)
$ErrorActionPreference = 'Stop'
$TaskRoot = Split-Path -Parent $PSScriptRoot
$NodePath = (Get-Command node).Source
$UpdaterPath = Join-Path $PSScriptRoot 'update-data.mjs'
if (-not $Install) {
  Write-Output "Run immediately: node `"$UpdaterPath`""
  Write-Output 'Install daily Windows task: powershell -ExecutionPolicy Bypass -File scripts/schedule-updates.ps1 -Install'
  Write-Output "Default update time: $Time; requires this Windows account to be logged in."
  exit 0
}
$TaskAction = New-ScheduledTaskAction -Execute $NodePath -Argument ('"' + $UpdaterPath + '"') -WorkingDirectory $TaskRoot
$TaskTrigger = New-ScheduledTaskTrigger -Daily -At $Time
$TaskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'TusuanTravelDataDaily' -Action $TaskAction -Trigger $TaskTrigger -Settings $TaskSettings -Description 'Refresh public reference FX and validated official travel prices; preserves failures and history.' -Force | Select-Object TaskName,State
$ScheduleMetadata = @{ taskName = 'TusuanTravelDataDaily'; installed = $true; dailyAt = $Time; timezone = [System.TimeZoneInfo]::Local.Id; installedAt = (Get-Date).ToUniversalTime().ToString('o'); runsWhen = 'Windows account logged in'; note = 'Installation record; does not verify the task has remained enabled after installation.' }
$SchedulePath = Join-Path $TaskRoot 'data\schedule.json'
$ScheduleMetadata | ConvertTo-Json | Set-Content -LiteralPath $SchedulePath -Encoding UTF8
