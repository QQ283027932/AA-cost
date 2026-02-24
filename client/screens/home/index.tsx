import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

interface Activity {
  id: string;
  title: string;
  total_amount: number;
  created_at: string;
  participantsCount: number;
}

export default function HomePage() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：GET /api/v1/activities
       * Query 参数：无
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities || []);
      } else {
        console.error('Failed to fetch activities:', data.error);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  const handleCreateActivity = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入活动名称');
      return;
    }
    if (!totalAmount.trim() || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
      Alert.alert('提示', '请输入有效的总金额');
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：POST /api/v1/activities
       * Body 参数：title: string, totalAmount: number
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          totalAmount: Number(totalAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalVisible(false);
        setTitle('');
        setTotalAmount('');
        fetchActivities();
      } else {
        Alert.alert('错误', data.error || '创建活动失败');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      Alert.alert('错误', '创建活动失败');
    }
  };

  const handleDeleteActivity = (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个活动吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              /**
               * 服务端文件：server/src/routes/activities.ts
               * 接口：DELETE /api/v1/activities/:id
               * Path 参数：id: string
               */
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${id}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                fetchActivities();
              } else {
                Alert.alert('错误', '删除失败');
              }
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h1" color={theme.textPrimary} style={styles.headerTitle}>
            AA 费用分摊
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.headerDescription}>
            轻松管理活动费用，自动计算每人应付金额
          </ThemedText>
        </ThemedView>

        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyIcon, { color: theme.textMuted }]}>📊</ThemedText>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.emptyTitle}>
              暂无活动
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.emptyDescription}>
              点击右下角 + 号创建第一个 AA 分摊活动
            </ThemedText>
          </View>
        ) : (
          activities.map((activity) => (
            <ThemedView
              key={activity.id}
              level="default"
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <ThemedText variant="h3" color={theme.textPrimary} numberOfLines={1}>
                    {activity.title}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => handleDeleteActivity(activity.id)}>
                  <FontAwesome6 name="trash" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.cardMetaItem}>
                  <FontAwesome6 name="coins" size={14} color={theme.primary} style={styles.cardMetaIcon} />
                  <ThemedText variant="caption" color={theme.textSecondary} style={styles.cardMetaText}>
                    总计 ¥{activity.total_amount}
                  </ThemedText>
                </View>
                <View style={styles.cardMetaItem}>
                  <FontAwesome6 name="users" size={14} color={theme.primary} style={styles.cardMetaIcon} />
                  <ThemedText variant="caption" color={theme.textSecondary} style={styles.cardMetaText}>
                    {activity.participantsCount} 人
                  </ThemedText>
                </View>
                <View style={styles.cardMetaItem}>
                  <FontAwesome6 name="calendar" size={14} color={theme.primary} style={styles.cardMetaIcon} />
                  <ThemedText variant="caption" color={theme.textSecondary} style={styles.cardMetaText}>
                    {formatDate(activity.created_at)}
                  </ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  marginTop: Spacing.md,
                  paddingVertical: Spacing.sm,
                  backgroundColor: theme.primary,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => router.push(`/detail`, { id: activity.id })}
              >
                <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                  查看详情
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <ThemedText variant="h2" color={theme.buttonPrimaryText} style={styles.fabIcon}>
          +
        </ThemedText>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: theme.backgroundDefault,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: Spacing.xl,
            }}
          >
            <ThemedText variant="h3" color={theme.textPrimary} style={{ marginBottom: Spacing.xl }}>
              创建新活动
            </ThemedText>

            <ThemedText variant="body" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
              活动名称
            </ThemedText>
            <TextInput
              style={{
                backgroundColor: theme.backgroundTertiary,
                borderRadius: 8,
                padding: Spacing.md,
                marginBottom: Spacing.lg,
                color: theme.textPrimary,
                borderWidth: 1,
                borderColor: theme.borderLight,
              }}
              placeholder="例如：周末聚餐"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <ThemedText variant="body" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
              总金额
            </ThemedText>
            <TextInput
              style={{
                backgroundColor: theme.backgroundTertiary,
                borderRadius: 8,
                padding: Spacing.md,
                marginBottom: Spacing["2xl"],
                color: theme.textPrimary,
                borderWidth: 1,
                borderColor: theme.borderLight,
              }}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              value={totalAmount}
              onChangeText={setTotalAmount}
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setModalVisible(false);
                  setTitle('');
                  setTotalAmount('');
                }}
              >
                <ThemedText variant="body" color={theme.textSecondary}>
                  取消
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: 8,
                  backgroundColor: theme.primary,
                  alignItems: 'center',
                }}
                onPress={handleCreateActivity}
              >
                <ThemedText variant="body" color={theme.buttonPrimaryText}>
                  创建
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
