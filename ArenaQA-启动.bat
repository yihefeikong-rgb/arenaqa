@echo off
title ArenaQA — AI 问答竞技场

echo ============================================
echo   ArenaQA — AI 问答竞技场
echo   正在启动开发服务器...
echo ============================================
echo.

cd /d "D:\claude code xiangmu\并发AI问答"

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [*] 首次运行，正在安装依赖...
    call npm install
    echo.
)

echo [✓] 启动成功！
echo [*] 浏览器打开 http://localhost:3000
echo [*] 按 Ctrl+C 停止服务器
echo.

npm run dev

pause
