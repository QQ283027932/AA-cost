#!/bin/bash

# 安卓 APP 构建脚本

echo "=========================================="
echo "     安卓 APP 构建脚本"
echo "=========================================="
echo ""

# 检查 EAS CLI 是否安装
if ! command -v eas &> /dev/null; then
    echo "EAS CLI 未安装，正在安装..."
    npm install -g eas-cli
fi

echo "开始构建安卓 APP..."
echo ""

# 检查是否已登录
if ! eas whoami &> /dev/null; then
    echo "请先登录 EAS 账号"
    eas login
fi

echo ""
echo "选择构建类型："
echo "1) 预览版本 (APK，用于测试)"
echo "2) 生产版本 (APK，正式发布)"
read -p "请输入选项 (1 或 2): " choice

case $choice in
    1)
        echo "构建预览版本..."
        eas build --platform android --profile preview
        ;;
    2)
        echo "构建生产版本..."
        eas build --platform android --profile production
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "     构建完成！"
echo "=========================================="
echo "APK 文件将通过 EAS 提供下载链接"
