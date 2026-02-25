# 安卓 APP 打包指南（Windows）

## 方法一：使用 EAS Build（推荐）

### 前置要求
- Node.js（已安装）
- 终端（PowerShell 或 CMD）

### 步骤 1：安装 EAS CLI
在 PowerShell 或 CMD 中执行：
```powershell
cd client
npm install -g eas-cli
```

### 步骤 2：登录 EAS 账号
```powershell
eas login
```

### 步骤 3：构建 APK 文件

#### 构建预览版本（用于测试）
```powershell
eas build --platform android --profile preview
```

#### 构建生产版本
```powershell
eas build --platform android --profile production
```

### 步骤 4：下载 APK
构建完成后，EAS 会提供一个下载链接，下载 APK 文件即可安装到安卓设备。

---

## 方法二：使用自动构建脚本（Windows）

### 直接双击运行
1. 打开文件资源管理器
2. 找到 `build-android.bat` 文件
3. 双击运行

### 或在 CMD 中运行
```cmd
build-android.bat
```

### 在 PowerShell 中运行
```powershell
.\build-android.bat
```

按照提示操作即可自动完成构建。

---

## 方法三：本地构建（不推荐）

### 前置要求
- 安装 Android Studio（很大型）
- 配置 Android SDK（需要几GB空间）
- 安装 Java JDK 17 或更高版本
- 配置环境变量

### 步骤（复杂）
```powershell
cd client
npx expo prebuild --clean
cd android
.\gradlew.bat assembleRelease
```

APK 文件位置：`android/app/build/outputs/apk/release/app-release.apk`

---

## Windows 11 快速开始

### 方式一：使用 PowerShell（推荐）
1. 右键点击"开始"按钮，选择"终端 (管理员)"
2. 运行以下命令：
```powershell
cd C:\path\to\projects\client
npx eas-cli@latest build --platform android --profile preview
```

### 方式二：使用 CMD
1. 按 `Win + R`，输入 `cmd`，回车
2. 运行以下命令：
```cmd
cd C:\path\to\projects\client
npx eas-cli@latest build --platform android --profile preview
```

### 方式三：使用批处理脚本（最简单）
1. 在文件资源管理器中找到 `build-android.bat`
2. 双击运行
3. 按照提示操作

---

## 注意事项

1. **EAS Build 是云端构建**，不需要安装 Android Studio
2. **构建时间**：通常需要 10-30 分钟
3. **网络要求**：稳定的网络连接（构建过程在云端进行）
4. **EAS 账号**：需要登录 EAS 账号（免费注册）
5. **APK 安装**：下载的 APK 可以直接传到安卓手机安装

## 常见问题

### Q: 需要安装 Android Studio 吗？
A: **不需要！** 使用 EAS Build 可以在云端构建，不需要本地安装任何 Android 开发工具。

### Q: 需要安装 Java 吗？
A: **不需要！** EAS Build 在云端进行，本地不需要 Java 环境。

### Q: 构建需要多长时间？
A: 第一次构建可能需要 20-30 分钟，后续构建会快一些（10-15 分钟）。

### Q: 可以同时构建多个版本吗？
A: 可以，EAS 支持并行构建。

### Q: APK 文件在哪里？
A: EAS 构建完成后，会提供下载链接，直接下载即可。

## 推荐流程（Windows 11）

1. **打开 PowerShell**：右键"开始" → "终端 (管理员)"
2. **进入项目目录**：
```powershell
cd C:\your\project\path\client
```
3. **执行构建命令**：
```powershell
npx eas-cli@latest build --platform android --profile preview
```
4. **登录 EAS**：按提示输入邮箱和密码
5. **等待构建**：大约 10-30 分钟
6. **下载 APK**：通过 EAS 提供的链接下载

就这么简单！🎉
