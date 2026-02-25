# 安卓 APP 打包快速指南

## Windows 11 用户（推荐）

### 最简单的方式（3步完成）

#### 步骤 1：打开 PowerShell
- 右键点击"开始"按钮
- 选择"终端"或"PowerShell"

#### 步骤 2：进入项目目录并构建
```powershell
cd C:\你的项目路径\client
npx eas-cli@latest build --platform android --profile preview
```

#### 步骤 3：登录并等待
1. 输入你的邮箱和密码登录 EAS
2. 等待 10-30 分钟
3. 通过链接下载 APK

### 使用批处理脚本（更简单）

1. 在文件资源管理器中找到 `build-android.bat`
2. 双击运行
3. 按照提示操作

## 其他系统

- **Linux/Mac**：参考 `build-android.sh`
- **通用**：参考 `ANDROID_BUILD_GUIDE_WINDOWS.md`

## 注意事项

✅ **不需要安装 Android Studio**
✅ **不需要安装 Java**
✅ **不需要安装 Android SDK**
✅ **全部在云端构建**

只需要：
- 电脑已安装 Node.js
- 稳定的网络连接
- EAS 账号（免费）
