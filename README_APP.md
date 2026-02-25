# A一下 APP - 使用说明

## 📱 项目介绍

"A一下"是一个费用分摊管理应用，支持：
- 创建多人活动
- 添加参与者和费用记录
- 自动计算每人应付金额
- 管理参与者离开/重新加入状态

## 📦 如何获得 APK

### 方法 1：下载代码自己构建（推荐）

#### 步骤 1：下载项目
1. 下载项目压缩包：`a-yi-xia-app.tar.gz` (3.7MB)
2. 解压到任意文件夹

#### 步骤 2：一键构建
1. 打开解压后的文件夹
2. 双击运行 `build-app.bat`
3. 按照提示操作：
   - 注册/登录 EAS 账号（免费）
   - 等待 10-30 分钟
   - 下载 APK

### 方法 2：使用命令行

```bash
# 进入项目目录
cd path/to/your/project/client

# 构建 APK
npx eas-cli@latest build --platform android --profile preview
```

### 方法 3：上传到 GitHub

1. 将代码上传到 GitHub 仓库
2. 连接 EAS 账号
3. 在 GitHub Actions 中配置自动构建

## 🚀 快速开始（3 分钟）

1. **下载**：下载 `a-yi-xia-app.tar.gz`
2. **解压**：解压到本地文件夹
3. **构建**：双击 `build-app.bat`
4. **等待**：10-30 分钟后下载 APK
5. **安装**：将 APK 传到手机安装

## 📋 项目结构

```
a-yi-xia-app/
├── client/           # 前端（React Native + Expo）
│   ├── app/         # 页面路由
│   ├── screens/     # 页面组件
│   ├── components/  # 通用组件
│   └── assets/      # 资源文件
├── server/          # 后端（Express + Supabase）
│   └── src/         # 源代码
├── build-app.bat    # Windows 一键构建脚本
└── README.md        # 本文件
```

## 🛠️ 技术栈

- **前端**：Expo 54 + React Native + TypeScript
- **后端**：Express.js + Supabase
- **数据库**：Supabase (PostgreSQL)
- **构建工具**：EAS Build

## ❓ 常见问题

### Q: 需要安装 Android Studio 吗？
A: **不需要！** 使用 EAS 云端构建，不需要本地安装任何 Android 开发工具。

### Q: 需要安装 Java 吗？
A: **不需要！** EAS 在云端构建，本地不需要 Java。

### Q: 构建需要多长时间？
A: 第一次约 20-30 分钟，后续 10-15 分钟。

### Q: EAS 账号收费吗？
A: **免费！** EAS 基础构建完全免费。

### Q: APK 安装安全吗？
A: 完全安全，代码都是开源的。

## 📞 需要帮助？

- 查看 `DOWNLOAD_AND_BUILD_GUIDE.md` 获取详细指南
- 查看 `ANDROID_BUILD_GUIDE_WINDOWS.md` 获取 Windows 专用指南
- 如果遇到问题，请联系技术支持

## 📝 更新日志

### v1.0.0 (2026-02-25)
- ✅ 初始版本发布
- ✅ 支持创建活动和管理参与者
- ✅ 支持费用记录和分摊计算
- ✅ 支持参与者离开/重新加入
- ✅ 支持添加费用时记忆上次选择

## 🎯 后续计划

- [ ] 支持导出费用报告
- [ ] 支持多币种
- [ ] 支持费用提醒
- [ ] 支持数据备份和恢复
