@echo off
chcp 65001 >nul
echo ==========================================
echo     A一下 APP 一键构建脚本
echo ==========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
echo.

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未检测到 npm
    pause
    exit /b 1
)

echo ✓ npm 已安装
echo.

REM 简化：直接进入构建流程，不检查登录状态
echo 跳过登录检查，直接进入构建流程...
echo 如果尚未登录，构建过程中会提示登录
echo.

REM 进入 client 目录
cd /d "%~dp0client"

echo ==========================================
echo     准备构建安卓 APP...
echo ==========================================
echo.

REM 检查是否需要安装依赖
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    echo.
)

echo ==========================================
echo     开始构建...
echo ==========================================
echo.
echo 请按照提示操作：
echo 1. 正在提交构建到 EAS 云端...
echo 2. 构建可能需要 10-30 分钟
echo 3. 构建完成后会显示下载链接
echo.
echo 按任意键开始构建，或按 Ctrl+C 取消...
pause >nul

echo.
echo [%time%] 正在提交构建请求到 EAS...
echo 注意：此过程可能需要几分钟，请耐心等待...
echo.

REM 使用 --wait 标志等待构建完成
npx eas-cli@latest build --platform android --profile preview --wait

if %errorlevel% neq 0 (
    echo.
    echo [错误] 构建过程失败！
    echo 请检查以下可能的问题：
    echo 1. 网络连接是否正常
    echo 2. 项目配置是否正确
    echo 3. 查看上方错误信息
    echo.
    echo 尝试重新运行构建，或检查构建日志：
    echo npx eas-cli build:list --limit 5
    pause
    exit /b 1
)

echo.
echo ==========================================
echo     构建成功完成！
echo ==========================================
echo.
echo 构建已完成，您可以：
echo 1. 下载 APK 文件
echo 2. 传输到手机安装
echo.
echo 按任意键退出...
pause >nul
exit /b 0
