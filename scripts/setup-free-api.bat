@echo off
chcp 65001 >nul
echo ============================================
echo   ArenaQA 免费模型部署向导
echo ============================================
echo.
echo 此脚本将检查 Docker 环境并提示配置免费模型。
echo 免费模型通过 Docker 本地部署 LLM-Red-Team 镜像。
echo.
echo ⚠️  仅供学习研究，请勿用于商业用途
echo.

REM 检查 Docker
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Docker，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [✓] Docker 已安装

REM 拉取镜像
echo.
echo [*] 正在拉取免费模型镜像（7 个）...
echo 这可能需要几分钟...

set IMAGES=kimi-free-api qwen-free-api deepseek-free-api doubao-free-api glm-free-api spark-free-api metaso-free-api

for %%i in (%IMAGES%) do (
    echo [+] 拉取 vinlic/%%i:latest ...
    docker pull vinlic/%%i:latest 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [!] 拉取失败，请检查网络或镜像是否可用
    )
)

REM Token 配置提示
echo.
echo ============================================
echo   Token 配置说明
echo ============================================
echo.
echo 每个免费模型需要网页 Cookie Token，请在 .env 中配置：
echo.
echo FREE_KIMI_FREE_TOKEN=your_kimi_cookie
echo FREE_QWEN_FREE_TOKEN=your_qwen_cookie
echo FREE_DEEPSEEK_FREE_TOKEN=your_deepseek_cookie
echo FREE_DOUBAO_FREE_TOKEN=your_doubao_cookie
echo FREE_GLM_FREE_TOKEN=your_glm_cookie
echo FREE_SPARK_FREE_TOKEN=your_spark_cookie
echo FREE_METASO_FREE_TOKEN=your_metaso_cookie
echo.
echo 获取方式：登录对应平台网页版，从浏览器 DevTools
echo Application ^> Cookies 中复制对应 Cookie 值
echo.

REM 启动服务
echo [*] 启动免费模型服务...
docker compose -f docker-compose.free.yml up -d

if %ERRORLEVEL% equ 0 (
    echo.
    echo ============================================
    echo   部署完成！
    echo ============================================
    echo.
    echo 服务端口:
    echo   Kimi:      http://localhost:8001/health
    echo   千问:      http://localhost:8002/health
    echo   DeepSeek:  http://localhost:8003/health
    echo   豆包:      http://localhost:8004/health
    echo   智谱:      http://localhost:8005/health
    echo   星火:      http://localhost:8006/health
    echo   秘塔:      http://localhost:8007/health
    echo.
    echo 验证: curl http://localhost:8001/v1/models
) else (
    echo [错误] 服务启动失败，请检查 Docker 状态
)

pause
