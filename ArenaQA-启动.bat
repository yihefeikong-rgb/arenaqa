@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
title ArenaQA

cd /d "D:\claude code xiangmu\并发AI问答"

echo [1/4] Kill old processes...
taskkill /F /IM node.exe 2>nul

echo [2/4] Check deps...
if not exist "node_modules" (
  call npm install
  if !errorlevel! neq 0 pause & exit /b 1
)

echo [3/4] Start server...
start "ArenaQA" cmd /c "npm run dev"
timeout /t 5 >nul

echo [4/4] Opening browser...
start http://localhost:3000

echo Server started. Close this window to stop.
pause
endlocal