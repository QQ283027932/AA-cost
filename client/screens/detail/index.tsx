import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Text, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import dayjs from 'dayjs';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

interface Participant {
  id: string;
  name: string;
  joined_at: string;
  left_at: string | null;
}

interface Expense {
  id: string;
  activity_id: string;
  amount: number;
  description: string;
  expense_date: string;
}

interface ActivityDetail {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
}

export default function DetailPage() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ id: string }>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPerPerson, setAmountPerPerson] = useState(0);
  const [currentParticipantsCount, setCurrentParticipantsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [participantName, setParticipantName] = useState('');

  const fetchActivityDetail = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：GET /api/v1/activities/:id
       * Path 参数：id: string
       */
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${params.id}`
      );
      const data = await response.json();

      if (response.ok) {
        setActivity(data.activity);
        setExpenses(data.expenses || []);
        setParticipants(data.participants || []);
        setTotalAmount(data.totalAmount || 0);
        setAmountPerPerson(data.amountPerPerson || 0);
        setCurrentParticipantsCount(data.currentParticipantsCount || 0);
      } else {
        console.error('Failed to fetch activity detail:', data.error);
      }
    } catch (error) {
      console.error('Error fetching activity detail:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      fetchActivityDetail();
    }, [fetchActivityDetail])
  );

  const handleAddExpense = async () => {
    if (!expenseDescription.trim()) {
      Alert.alert('提示', '请输入费用描述');
      return;
    }
    if (!expenseAmount.trim() || isNaN(Number(expenseAmount)) || Number(expenseAmount) <= 0) {
      Alert.alert('提示', '请输入有效的金额');
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：POST /api/v1/activities/:id/expenses
       * Path 参数：id: string
       * Body 参数：amount: number, description: string
       */
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${params.id}/expenses`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(expenseAmount),
            description: expenseDescription.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setExpenseModalVisible(false);
        setExpenseAmount('');
        setExpenseDescription('');
        fetchActivityDetail();
      } else {
        Alert.alert('错误', data.error || '添加费用失败');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('错误', '添加费用失败');
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这笔费用记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              /**
               * 服务端文件：server/src/routes/activities.ts
               * 接口：DELETE /api/v1/activities/:id/expenses/:expenseId
               * Path 参数：id: string, expenseId: string
               */
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${params.id}/expenses/${expenseId}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                fetchActivityDetail();
              } else {
                Alert.alert('错误', '删除失败');
              }
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const handleAddParticipant = async () => {
    if (!participantName.trim()) {
      Alert.alert('提示', '请输入参与者姓名');
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：POST /api/v1/activities/:id/participants
       * Path 参数：id: string
       * Body 参数：name: string
       */
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${params.id}/participants`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: participantName.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setParticipantModalVisible(false);
        setParticipantName('');
        fetchActivityDetail();
      } else {
        Alert.alert('错误', data.error || '添加参与者失败');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert('错误', '添加参与者失败');
    }
  };

  const handleLeaveParticipant = (participantId: string) => {
    Alert.alert(
      '确认离开',
      '确定要标记这位参与者已经离开吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              /**
               * 服务端文件：server/src/routes/activities.ts
               * 接口：PATCH /api/v1/activities/:id/participants/:participantId
               * Path 参数：id: string, participantId: string
               * Body 参数：leftAt: string
               */
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${params.id}/participants/${participantId}`,
                {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    leftAt: new Date().toISOString(),
                  }),
                }
              );

              if (response.ok) {
                fetchActivityDetail();
              } else {
                Alert.alert('错误', '操作失败');
              }
            } catch (error) {
              console.error('Error updating participant:', error);
              Alert.alert('错误', '操作失败');
            }
          },
        },
      ]
    );
  };

  const handleDeleteParticipant = (participantId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这位参与者吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              /**
               * 服务端文件：server/src/routes/activities.ts
               * 接口：DELETE /api/v1/activities/:id/participants/:participantId
               * Path 参数：id: string, participantId: string
               */
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${params.id}/participants/${participantId}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                fetchActivityDetail();
              } else {
                Alert.alert('错误', '删除失败');
              }
            } catch (error) {
              console.error('Error deleting participant:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getAvatarInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('MM-DD HH:mm');
  };

  if (!activity) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>加载中...</ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={16} color={theme.primary} style={styles.backIcon} />
            <ThemedText style={[styles.backText, { color: theme.primary }]}>返回</ThemedText>
          </TouchableOpacity>

          <ThemedText variant="h2" color={theme.textPrimary} style={styles.activityTitle}>
            {activity.title}
          </ThemedText>

          <View style={styles.activityMeta}>
            <View style={styles.activityMetaItem}>
              <FontAwesome6 name="coins" size={14} color={theme.primary} style={styles.activityMetaIcon} />
              <ThemedText variant="caption" color={theme.textSecondary} style={styles.activityMetaText}>
                总花费 ¥{totalAmount}
              </ThemedText>
            </View>
            <View style={styles.activityMetaItem}>
              <FontAwesome6 name="users" size={14} color={theme.primary} style={styles.activityMetaIcon} />
              <ThemedText variant="caption" color={theme.textSecondary} style={styles.activityMetaText}>
                {currentParticipantsCount} 人
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedView
          level="default"
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.primary,
            },
          ]}
        >
          <ThemedText variant="h3" color="#fff" style={styles.summaryTitle}>
            每人应付
          </ThemedText>
          <ThemedText variant="h1" color="#fff" style={styles.amountPerPerson}>
            ¥{amountPerPerson}
          </ThemedText>
          <ThemedText variant="caption" color="rgba(255,255,255,0.8)" style={styles.amountLabel}>
            {totalAmount} ÷ {currentParticipantsCount}
          </ThemedText>
        </ThemedView>

        {/* 费用记录 */}
        <View style={{ marginBottom: Spacing.xl }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.sectionTitle}>
              费用记录
            </ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={() => setExpenseModalVisible(true)}>
              <FontAwesome6 name="plus" size={16} color={theme.primary} />
              <ThemedText style={[styles.addButtonText, { color: theme.primary }]}>添加</ThemedText>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                暂无费用记录，点击上方「添加」按钮添加
              </ThemedText>
            </View>
          ) : (
            expenses.map((expense) => (
              <ThemedView
                key={expense.id}
                level="default"
                style={[
                  styles.expenseItem,
                  {
                    backgroundColor: theme.backgroundDefault,
                  },
                ]}
              >
                <View style={styles.expenseInfo}>
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.expenseDescription}>
                    {expense.description || '未命名费用'}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.expenseDate}>
                    {formatTime(expense.expense_date)}
                  </ThemedText>
                </View>
                <View style={styles.expenseActions}>
                  <ThemedText variant="h3" color={theme.primary} style={styles.expenseAmount}>
                    ¥{expense.amount}
                  </ThemedText>
                  <TouchableOpacity onPress={() => handleDeleteExpense(expense.id)} style={{ marginLeft: Spacing.sm }}>
                    <FontAwesome6 name="trash" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))
          )}
        </View>

        {/* 参与者 */}
        <View>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.sectionTitle}>
              参与者
            </ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={() => setParticipantModalVisible(true)}>
              <FontAwesome6 name="plus" size={16} color={theme.primary} />
              <ThemedText style={[styles.addButtonText, { color: theme.primary }]}>添加</ThemedText>
            </TouchableOpacity>
          </View>

          {participants.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                暂无参与者，点击上方「添加」按钮添加
              </ThemedText>
            </View>
          ) : (
            participants.map((participant) => (
              <ThemedView
                key={participant.id}
                level="default"
                style={[
                  styles.participantItem,
                  {
                    backgroundColor: theme.backgroundDefault,
                    opacity: participant.left_at ? 0.6 : 1,
                  },
                ]}
              >
                <View style={styles.participantRow}>
                  <View style={[styles.participantAvatar, { backgroundColor: getAvatarColor(participant.name) }]}>
                    <Text style={styles.participantAvatarText}>{getAvatarInitial(participant.name)}</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <ThemedText variant="body" color={theme.textPrimary} style={styles.participantName}>
                      {participant.name}
                      {participant.left_at && ' (已离开)'}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.participantTime}>
                      加入：{formatTime(participant.joined_at)}
                      {participant.left_at && ` | 离开：${formatTime(participant.left_at)}`}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.participantActions}>
                  {!participant.left_at && (
                    <TouchableOpacity onPress={() => handleLeaveParticipant(participant.id)}>
                      <FontAwesome6 name="right-from-bracket" size={18} color="#F59E0B" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteParticipant(participant.id)}>
                    <FontAwesome6 name="trash" size={18} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))
          )}
        </View>
      </ScrollView>

      {/* 添加费用 Modal */}
      <Modal visible={expenseModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
                添加费用记录
              </ThemedText>

              <ThemedText variant="body" color={theme.textSecondary} style={styles.inputLabel}>
                费用描述
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundTertiary,
                    borderColor: theme.borderLight,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="例如：午餐"
                placeholderTextColor={theme.textMuted}
                value={expenseDescription}
                onChangeText={setExpenseDescription}
                autoFocus
              />

              <ThemedText variant="body" color={theme.textSecondary} style={styles.inputLabel}>
                金额
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundTertiary,
                    borderColor: theme.borderLight,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="decimal-pad"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setExpenseModalVisible(false);
                    setExpenseAmount('');
                    setExpenseDescription('');
                  }}
                >
                  <ThemedText variant="body" style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    取消
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.primary }]}
                  onPress={handleAddExpense}
                >
                  <ThemedText variant="body" style={[styles.submitButtonText, { color: theme.buttonPrimaryText }]}>
                    确定
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 添加参与者 Modal */}
      <Modal visible={participantModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
                添加参与者
              </ThemedText>

              <ThemedText variant="body" color={theme.textSecondary} style={styles.inputLabel}>
                姓名
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.backgroundTertiary,
                    borderColor: theme.borderLight,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="请输入参与者姓名"
                placeholderTextColor={theme.textMuted}
                value={participantName}
                onChangeText={setParticipantName}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setParticipantModalVisible(false);
                    setParticipantName('');
                  }}
                >
                  <ThemedText variant="body" style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    取消
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.primary }]}
                  onPress={handleAddParticipant}
                >
                  <ThemedText variant="body" style={[styles.submitButtonText, { color: theme.buttonPrimaryText }]}>
                    确定
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
