@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 or later, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd install
  if errorlevel 1 exit /b 1
)
call npm.cmd run build
if errorlevel 1 (
  pause
  exit /b 1
)
echo.
echo Open http://127.0.0.1:8787 in your browser.
echo Keep this window open while using the app. Press Ctrl+C to stop.
call npm.cmd start
pause
