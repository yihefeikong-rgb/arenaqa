@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title ArenaQA — AI 问答竞技场

echo ============================================
echo   ArenaQA — AI 问答竞技场
echo   正在启动开发服务器...
echo ============================================
echo.

cd /d "D:\claude code xiangmu\并发AI问答"

:: ============================================
:: 第一步：杀死占用 3000 端口的旧进程
:: ============================================
echo [1/4] 检查端口 3000 占用...
set "KILLED="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTEN"') do (
    if not "%%a"=="" (
        echo [-] 发现占用进程 PID: %%a，正在终止...
        taskkill /F /PID %%a >nul 2>&1
        if !errorlevel! equ 0 (
            echo [OK] 旧进程已终止
        )
        set KILLED=1
    )
)
if not defined KILLED (
    echo [*] 端口 3000 未被占用
)
echo [OK] 端口检查完成

:: 等待端口释放
if defined KILLED (
    timeout /t 2 /nobreak >nul
)

:: ============================================
:: 第二步：检查 node_modules
:: ============================================
echo [2/4] 检查项目依赖...
if not exist "node_modules" (
    echo [*] 首次运行，正在安装依赖...
    echo.
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [X] 依赖安装失败，请检查网络后重试
        pause
        exit /b 1
    )
    echo.
)
echo [OK] 依赖检查完成

:: ============================================
:: 第三步：清理缓存并启动服务器（后台）
:: ============================================
echo [3/4] 清理缓存并启动服务器...
if exist ".next" (
    echo [*] 清理旧构建缓存...
    rmdir /s /q .next >nul 2>&1
)

:: 后台启动 dev server
start "ArenaQA Server" cmd /c "npm run dev"

:: 等待进程启动
timeout /t 3 /nobreak >nul

:: ============================================
:: 第四步：等待服务器就绪（最多 60 秒）
:: ============================================
echo [4/4] 等待服务器就绪...
set "READY="
for /l %%i in (1,1,30) do (
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if !errorlevel! equ 0 (
        set READY=1
        goto SERVER_READY
    )
    timeout /t 2 /nobreak >nul
)

:SERVER_READY
cls
echo ============================================
echo   ArenaQA — AI 问答竞技场
echo ============================================
echo.
if defined READY (
    echo [OK] 服务器已就绪！
    echo.
    echo [*] 请打开浏览器访问：
    echo.
    echo     http://localhost:3000
    echo.
    echo [*] 按 Ctrl+C 停止服务器
    echo [*] 关闭此窗口也将关闭服务器
    echo [*] 服务器控制台窗口请勿关闭
    echo.
) else (
    echo [!] 服务器启动超时（已等待 60 秒）
    echo.
    echo [*] 请手动打开 http://localhost:3000 检查状态
    echo [*] 服务器窗口可能仍在启动中
    echo [*] 如持续失败，请检查终端输出中的错误信息
    echo.
)
echo ============================================
echo.
pause
endlocal