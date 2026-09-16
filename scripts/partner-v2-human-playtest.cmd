@echo off
setlocal
cd /d "%~dp0.."
node scripts\partner-v2-human-playtest.mjs --open %*
set "PV2_EXIT=%ERRORLEVEL%"
if not "%PV2_EXIT%"=="0" (
  echo.
  echo [partner-v2-playtest] Launcher finished with error %PV2_EXIT%.
  pause
)
exit /b %PV2_EXIT%
