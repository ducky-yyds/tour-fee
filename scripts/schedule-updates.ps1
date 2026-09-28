param(
  [switch]$Install,
  [string]$Time = '07:30'
)
$ErrorActionPreference = 'Stop'
$TaskRoot = Split-Path -Parent $PSScriptRoot
$NodePath = (Get-Command node).Source
$UpdaterPath = Join-Path $PSScriptRoot 'maintain-local.mjs'
if (-not $Install) {
  Write-Output "Run immediately: node `"$UpdaterPath`" --publish"
  Write-Output 'Install daily Windows task: powershell -ExecutionPolicy Bypass -File scripts/schedule-updates.ps1 -Install'
  Write-Output "Default update time: $Time; requires this Windows account to be logged in."
  exit 0
}
$TaskAction = New-ScheduledTaskAction -Execute $NodePath -Argument ('--env-file-if-exists=.env "' + $UpdaterPath + '" --publish') -WorkingDirectory $TaskRoot
$TaskTrigger = New-ScheduledTaskTrigger -Daily -At $Time
$TaskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 4) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'TusuanTravelDataDaily' -Action $TaskAction -Trigger $TaskTrigger -Settings $TaskSettings -Description 'Archive original assets, maintain destination data, back up SQLite and publish validated preview data; resumes after offline periods.' -Force | Select-Object TaskName,State
$ScheduleMetadata = @{ taskName = 'TusuanTravelDataDaily'; installed = $true; dailyAt = $Time; timezone = [System.TimeZoneInfo]::Local.Id; installedAt = (Get-Date).ToUniversalTime().ToString('o'); runsWhen = 'Windows account logged in'; note = 'Installation record; does not verify the task has remained enabled after installation.' }
$SchedulePath = Join-Path $TaskRoot 'data\schedule.json'
$ScheduleMetadata | ConvertTo-Json | Set-Content -LiteralPath $SchedulePath -Encoding UTF8
