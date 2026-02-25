# 代码预览 - A一下 APP

## 📱 首页代码（主要功能）

### 文件位置：`/workspace/projects/client/screens/home/index.tsx`

```typescript
// 应用标题
<ThemedText variant="h1" color={theme.textPrimary} style={styles.headerTitle}>
  A一下
</ThemedText>

// 活动列表
{activities.map((activity) => {
  return (
    <ThemedView key={activity.id} level="default">
      <View style={styles.cardHeader}>
        <ThemedText variant="h3">{activity.title}</ThemedText>
      </View>

      {/* 参与者列表 */}
      {participants.map((participant) => (
        <ThemedView key={participant.id}>
          <ThemedText>{participant.name}</ThemedText>

          {/* 状态标签 */}
          <TouchableOpacity onPress={() => handleToggleParticipantStatus(...)}>
            <Text>{participant.left_at ? '已离开' : '在活动'}</Text>
          </TouchableOpacity>

          {/* 操作按钮 */}
          <View>
            {participant.left_at ? (
              <TouchableOpacity onPress={() => handleToggleParticipantStatus(...)}>
                <FontAwesome6 name="rotate-left" /> {/* 重新加入 */}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handleToggleParticipantStatus(...)}>
                <FontAwesome6 name="right-from-bracket" /> {/* 退出 */}
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>
      ))}
    </ThemedView>
  );
})}
```

## 🔧 后端 API 代码

### 文件位置：`/workspace/projects/server/src/routes/activities.ts`

```typescript
// 获取活动列表
router.get('/', async (req, res) => {
  const { data: activities } = await client.from('activities').select('*');
  res.json({ activities });
});

// 创建新活动
router.post('/', async (req, res) => {
  const { data } = await client.from('activities').insert({
    title,
    start_date: new Date().toISOString()
  });
  res.json({ activity: data });
});

// 更新参与者状态（退出/重新加入）
router.patch('/:id/participants/:participantId', async (req, res) => {
  const { leftAt } = req.body;
  const { data } = await client.from('participants')
    .update({ left_at: leftAt })
    .eq('id', participantId);
  res.json({ participant: data });
});

// 添加费用记录
router.post('/:id/expenses', async (req, res) => {
  const { amount, description, payerId, participantIds } = req.body;

  // 创建费用
  const { data: expense } = await client.from('expenses').insert({
    amount,
    description,
    payer_id: payerId
  });

  // 创建分摊关系
  const relations = participantIds.map(id => ({
    expense_id: expense.id,
    participant_id: id
  }));

  await client.from('expense_participants').insert(relations);

  res.json({ expense });
});
```

## 🎨 样式代码

### 文件位置：`/workspace/projects/client/screens/home/styles.ts`

```typescript
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 8,
    },

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },

    statusActive: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },

    statusLeft: {
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
    },

    participantItem: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 4,
      borderRadius: 8,
    },
  });
};
```

## 📋 完整代码结构

```
client/
├── app/
│   ├── _layout.tsx          ← 根导航配置
│   └── (tabs)/              ← Tab 导航（如果有）
├── screens/
│   ├── home/
│   │   ├── index.tsx        ← 首页（600+ 行）
│   │   └── styles.ts        ← 首页样式（150+ 行）
│   └── detail/
│       ├── index.tsx        ← 详情页（500+ 行）
│       └── styles.ts        ← 详情页样式（120+ 行）
├── components/              ← 通用组件
│   ├── Screen.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
├── hooks/                   ← 自定义 Hooks
│   ├── useTheme.ts
│   └── useSafeRouter.ts
└── constants/               ← 常量配置
    └── theme.ts

server/
└── src/
    ├── index.ts             ← Express 服务器（100+ 行）
    └── routes/
        └── activities.ts    ← API 路由（400+ 行）
```

## ✅ 已实现的功能

### 前端功能
- ✅ 创建活动
- ✅ 查看活动列表
- ✅ 添加参与者
- ✅ 参与者状态切换（退出/重新加入）
- ✅ 添加费用记录
- ✅ 记忆上次选择的人员
- ✅ 显示结余金额
- ✅ 删除活动/参与者

### 后端功能
- ✅ CRUD 操作（活动、参与者、费用）
- ✅ 状态管理（离开时间）
- ✅ 费用分摊计算
- ✅ 支付人管理
- ✅ 数据验证

## 🔍 如何查看完整代码

### 方法 1：让我读取
直接告诉我：
```
"显示完整首页代码"
"显示完整详情页代码"
"显示完整后端代码"
```

### 方法 2：查看文件
代码文件位置：
```
/workspace/projects/client/screens/home/index.tsx
/workspace/projects/server/src/routes/activities.ts
```

### 方法 3：下载压缩包
```
/workspace/projects/a-yi-xia-app.tar.gz
```

## 📊 代码质量

- ✅ TypeScript 类型检查通过
- ✅ ESLint 代码规范检查通过
- ✅ React Hooks 规范
- ✅ 组件化设计
- ✅ 主题系统支持
- ✅ 错误处理完善

---

## 💡 总结

**代码已经在沙箱中了！** 包含：

1. **前端代码**（React Native + Expo）
2. **后端代码**（Express + Supabase）
3. **完整功能**（活动管理、费用分摊）
4. **配置文件**（构建配置、样式配置）
5. **文档**（使用说明、构建指南）

**您不需要再编写任何代码，只需要：**
- 查看代码（如果需要）
- 下载代码到本地
- 构建 APK

有任何问题请随时告诉我！
