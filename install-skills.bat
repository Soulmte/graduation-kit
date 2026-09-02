@echo off
setlocal
chcp 65001 >nul
title Graduation Kit - Skills 安装

echo.
echo  ==========================================
echo    Graduation Kit  -  Skills 安装
echo  ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [错误] 未检测到 Node.js
  echo.
  echo  请先安装 Node.js 18 或更高版本：
  echo    https://nodejs.org/
  echo.
  echo  安装后重新双击本文件即可。
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo  Node.js %NODE_VER%
echo.

set "FORCE=--force"
set "ANSWER="
set /p "ANSWER=已存在的 skill 是否覆盖更新? [Y/n] "
if /i "%ANSWER%"=="n" set "FORCE="
echo.

if exist "%~dp0bin\cli.js" (
  echo  使用本地包安装...
  echo.
  node "%~dp0bin\cli.js" install -g %FORCE%
) else (
  echo  从 npm 安装...
  echo.
  npx -y graduation-kit@latest install -g %FORCE%
)

if errorlevel 1 (
  echo.
  echo  [失败] 安装未完成，请看上面的错误信息。
  echo.
  echo  常见排查：
  echo    1. 检查网络是否通畅
  echo    2. 换国内镜像后重试：
  echo         npm config set registry https://registry.npmmirror.com
  echo    3. 跑一次环境诊断：
  echo         npx graduation-kit diagnose
  echo.
  pause
  exit /b 1
)

echo.
echo  ==========================================
echo    安装完成
echo  ==========================================
echo.
echo  安装位置：%USERPROFILE%\.agents\skills\
echo.
echo  请重启编辑器（Zed / Cursor / VS Code 等），
echo  新开一个会话才会加载这些 skills。
echo.
pause
