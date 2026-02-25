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
echo 1. 登录您的 EAS 账号（如果没有会提示注册）
echo 2. 等待云端构建（10-30 分钟）
echo 3. 构建完成后会显示下载链接
echo.
echo 按任意键开始构建...
pause >nul

npx eas-cli@latest build --platform android --profile preview

echo.
echo ==========================================
echo     构建完成！
echo ==========================================
echo.
echo 如果构建成功：
echo - EAS 会提供 APK 下载链接
echo - 点击链接下载即可安装到手机
echo.
echo 如果遇到问题：
echo - 请检查网络连接
echo - 确保已登录 EAS 账号
echo.
pause
