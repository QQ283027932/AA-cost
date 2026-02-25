# 代码位置说明

## 📍 您的代码就在这里！

所有代码都存储在**沙箱环境**中，位置如下：

```
/workspace/projects/
├── client/              ← 前端代码（React Native + Expo）
│   ├── app/            ← 页面路由
│   ├── screens/        ← 页面组件
│   │   ├── home/       ← 首页代码
│   │   │   ├── index.tsx  ← 首页组件（主要代码）
│   │   │   └── styles.ts  ← 首页样式
│   │   └── detail/      ← 详情页代码
│   ├── components/     ← 通用组件
│   ├── constants/      ← 常量配置
│   ├── hooks/          ← React Hooks
│   └── assets/         ← 资源文件
│
├── server/             ← 后端代码（Express + Supabase）
│   └── src/
│       ├── index.ts   ← 服务入口
│       └── routes/    ← API 路由
│           └── activities.ts  ← 活动相关接口
│
└── 各种配置文件...
```

## 📂 主要代码文件

### 前端核心文件

1. **首页**：`/workspace/projects/client/screens/home/index.tsx`
   - 显示活动列表
   - 管理参与者
   - 添加费用

2. **详情页**：`/workspace/projects/client/screens/detail/index.tsx`
   - 查看活动详情
   - 添加费用记录

3. **路由配置**：`/workspace/projects/client/app/_layout.tsx`
   - 导航配置

### 后端核心文件

1. **服务入口**：`/workspace/projects/server/src/index.ts`
   - Express 服务器配置

2. **API 路由**：`/workspace/projects/server/src/routes/activities.ts`
   - 所有活动相关接口

## 🔍 如何查看代码

### 方法 1：通过文件浏览器
如果您的平台支持文件浏览，可以：
1. 打开文件浏览器
2. 导航到 `/workspace/projects/`
3. 查看所有代码文件

### 方法 2：让我读取代码
您可以直接让我读取任何文件：
```
"读取 /workspace/projects/client/screens/home/index.tsx 文件"
```

### 方法 3：查看压缩包
所有代码已打包在：
```
/workspace/projects/a-yi-xia-app.tar.gz
```

## 📊 代码统计

- **前端代码**：约 2000+ 行
- **后端代码**：约 500+ 行
- **总文件数**：50+ 个
- **主要功能**：费用分摊、参与者管理、费用记录

## ✅ 代码状态

✅ 所有代码已完成
✅ 已通过 TypeScript 检查
✅ 已通过 ESLint 检查
✅ 已配置 EAS 构建

## 🎯 如何使用代码

### 如果您想查看代码
直接告诉我：
```
"显示首页代码"
"显示详情页代码"
"显示后端 API 代码"
```

### 如果您想下载代码
需要下载：
```
/workspace/projects/a-yi-xia-app.tar.gz
```

### 如果您想修改代码
直接告诉我：
```
"修改首页标题"
"添加新功能"
"修复某个 bug"
```

## 💡 重要提示

**代码已经在沙箱中了！** 您不需要再编写任何代码，只需要：

1. **查看代码**：告诉我您想看哪个文件
2. **下载代码**：下载压缩包到本地
3. **构建 APK**：使用提供的脚本构建

---

## ❓ 您想做什么？

1. 查看代码？
2. 下载代码？
3. 修改代码？
4. 构建 APK？

请告诉我您的需求，我会帮您操作！
