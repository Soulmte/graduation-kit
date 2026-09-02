@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Graduation Kit - Skills Installer

echo.
echo  ==========================================
echo    Graduation Kit  -  Skills Installer
echo  ==========================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] Node.js not found
  echo.
  echo  Please install Node.js 18 or higher:
  echo    https://nodejs.org/
  echo.
  echo  After installation, run this script again.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo  Node.js !NODE_VER!
echo.

REM Ask for overwrite
set "FORCE="
set "ANSWER="
set /p "ANSWER=Overwrite existing skills? [Y/n] "
if /i "!ANSWER!"=="y" set "FORCE=--force"
if /i "!ANSWER!"=="" set "FORCE=--force"
echo.

REM Install with --with-upstream to skip interactive prompt
if exist "%~dp0bin\cli.js" (
  echo  Installing from local package...
  echo.
  node "%~dp0bin\cli.js" install -g !FORCE! --with-upstream
) else (
  echo  Installing from npm registry...
  echo.
  npx -y graduation-kit@latest install -g !FORCE! --with-upstream
)

if errorlevel 1 (
  echo.
  echo  [FAILED] Installation incomplete. See error above.
  echo.
  echo  Common troubleshooting:
  echo    1. Check network connection
  echo    2. Switch to China mirror:
  echo         npm config set registry https://registry.npmmirror.com
  echo    3. Run diagnostics:
  echo         npx graduation-kit diagnose
  echo.
  pause
  exit /b 1
)

echo.
echo  ==========================================
echo    Installation Complete
echo  ==========================================
echo.
echo  Location: %USERPROFILE%\.agents\skills\
echo.
echo  Please restart your editor (Zed / Cursor / VS Code)
echo  and start a new session to load the skills.
echo.
pause
