@echo off
setlocal
cd /d "%~dp0"

set "SOURCE=%~1"
if "%SOURCE%"=="" set "SOURCE=%~dp0..\ktovret"

echo Mystery Logic - editorial preview 100 cases
echo Mobile source: %SOURCE%
echo.

node tools\preview-editorial.mjs --source "%SOURCE%"

if errorlevel 1 (
  echo.
  echo Preview failed. If the mobile source is in another folder, run:
  echo preview-all-100.cmd "C:\path\to\ktovret"
  pause
)
