@echo off
chcp 65001 >nul
echo ==========================================
echo      安卓 APP 构建脚本 (Windows)
echo ==========================================
echo.

REM 检查 EAS CLI 是否安装
where eas >nul 2>nul
if %errorlevel% neq 0 (
    echo EAS CLI 未安装，正在安装...
    call npm install -g eas-cli
)

echo 开始构建安卓 APP...
echo.

REM 检查是否已登录
eas whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo 请先登录 EAS 账号
    call eas login
)

echo.
echo 选择构建类型：
echo 1^) 预览版本 (APK，用于测试)
echo 2^) 生产版本 (APK，正式发布)
set /p choice="请输入选项 (1 或 2): "

if "%choice%"=="1" (
    echo 构建预览版本...
    call eas build --platform android --profile preview
) else if "%choice%"=="2" (
    echo 构建生产版本...
    call eas build --platform android --profile production
) else (
    echo 无效选项
    exit /b 1
)

echo.
echo ==========================================
echo      构建完成！
echo ==========================================
echo APK 文件将通过 EAS 提供下载链接
echo.

pause
