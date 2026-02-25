# 安卓 APP 打包指南

## 方法一：使用 EAS Build（推荐）

### 步骤 1：安装 EAS CLI
```bash
cd client
npm install -g eas-cli
```

### 步骤 2：登录 EAS 账号
```bash
eas login
```

### 步骤 3：构建 APK 文件

#### 构建预览版本（用于测试）
```bash
eas build --platform android --profile preview
```

#### 构建生产版本
```bash
eas build --platform android --profile production
```

### 步骤 4：下载 APK
构建完成后，EAS 会提供一个下载链接，下载 APK 文件即可安装到安卓设备。

---

## 方法二：本地构建

### 前置要求
- 安装 Android Studio
- 配置 Android SDK
- 安装 Java JDK 17 或更高版本

### 步骤 1：生成原生代码
```bash
cd client
npx expo prebuild --clean
```

### 步骤 2：进入安卓项目目录
```bash
cd android
```

### 步骤 3：构建 Release APK
```bash
./gradlew assembleRelease
```

### 步骤 4：查找 APK 文件
APK 文件位置：`android/app/build/outputs/apk/release/app-release.apk`

---

## 注意事项

1. **EAS Build** 是最简单的方法，不需要安装 Android SDK 和 Java
2. **构建时间**：EAS Build 通常需要 10-30 分钟
3. **APK vs AAB**：
   - APK 可以直接安装到设备
   - AAB 用于上传到 Google Play 商店

## 快速开始（推荐）

如果您已经安装了 Node.js，可以直接在项目根目录运行：

```bash
cd client
npx eas-cli@latest build --platform android --profile preview
```

按照提示登录 EAS 账号后，构建将自动开始。
