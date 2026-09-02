@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
::  毕设自研 Skills 一键安装脚本
::  用途：把 src/skills/ 下的 7 个核心 skill 复制到
::       用户全局 skills 目录 (~/.agents/skills)
:: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

title 安装毕设 Skills

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo    毕设自研 Agent Skills 安装工具
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: 1. 检查 src/skills/ 目录
if not exist "src\skills" (
    echo [错误] 找不到 src\skills\ 目录
    echo 请确保在 graduation-kit 项目根目录下运行此脚本
    echo.
    pause
    exit /b 1
)

:: 2. 确定目标目录
set "TARGET_DIR=%USERPROFILE%\.agents\skills"
echo [信息] 目标目录: %TARGET_DIR%
echo.

:: 3. 创建目标目录（如果不存在）
if not exist "%TARGET_DIR%" (
    echo [操作] 创建目录 %TARGET_DIR%
    mkdir "%TARGET_DIR%" 2>nul
    if errorlevel 1 (
        echo [错误] 无法创建目录，请检查权限
        pause
        exit /b 1
    )
)

:: 4. 列出要安装的 skills
echo [准备] 将安装以下 7 个 skills:
echo.
for /d %%i in (src\skills\*) do (
    echo   • %%~nxi
)
echo.

:: 5. 询问是否覆盖
set "OVERWRITE=N"
if exist "%TARGET_DIR%\graduation-project" (
    echo [提示] 检测到已安装的 skills，是否覆盖？
    set /p "OVERWRITE=覆盖已存在的 skills? (Y/N, 默认 N): "
    echo.
)

:: 6. 复制 skills
set "COUNT=0"
set "SKIPPED=0"
set "COPIED=0"

for /d %%i in (src\skills\*) do (
    set "SKILL_NAME=%%~nxi"
    set "TARGET_PATH=%TARGET_DIR%\!SKILL_NAME!"
    
    if exist "!TARGET_PATH!" (
        if /i "!OVERWRITE!" == "Y" (
            echo [覆盖] !SKILL_NAME!
            xcopy /E /I /Y /Q "%%i" "!TARGET_PATH!" >nul 2>&1
            if errorlevel 1 (
                echo [失败] 复制失败: !SKILL_NAME!
            ) else (
                set /a COPIED+=1
            )
        ) else (
            echo [跳过] !SKILL_NAME! (已存在)
            set /a SKIPPED+=1
        )
    ) else (
        echo [安装] !SKILL_NAME!
        xcopy /E /I /Y /Q "%%i" "!TARGET_PATH!" >nul 2>&1
        if errorlevel 1 (
            echo [失败] 复制失败: !SKILL_NAME!
        ) else (
            set /a COPIED+=1
        )
    )
    
    set /a COUNT+=1
)

:: 7. 汇总结果
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [完成] 安装统计:
echo   • 成功安装: %COPIED% 个
echo   • 跳过已存在: %SKIPPED% 个
echo   • 总计: %COUNT% 个
echo.
echo [路径] %TARGET_DIR%
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: 8. 提示 Zed 使用方法
if %COPIED% gtr 0 (
    echo [提示] Skills 已安装，现在可以在 Zed 中使用:
    echo.
    echo   1. 打开 Zed 编辑器
    echo   2. 按 Ctrl+Shift+P 打开命令面板
    echo   3. 输入 "agent" 找到 "Agent: Toggle Panel"
    echo   4. 在 Agent 面板输入框输入毕设相关需求时，相关 skill 会自动激活
    echo.
    echo   核心 skills:
    echo     • graduation-project  - 毕设全流程编排
    echo     • feature-forge       - 需求定义与功能边界
    echo     • database-designer   - 数据库设计
    echo     • api-designer        - 接口设计
    echo     • code-reviewer       - 代码审查
    echo     • thesis-writer       - 论文写作
    echo     • impeccable          - 前端 UI 优化
    echo.
)

pause
