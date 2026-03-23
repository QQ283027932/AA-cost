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

import {
  getActivityDetail,
  createExpense,
  deleteExpense,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  isDatabaseReady,
  Activity,
  Participant,
  Expense,
  ExpenseParticipant,
} from '@/services/database';

export default function DetailPage() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ id: string }>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenseParticipants, setExpenseParticipants] = useState<ExpenseParticipant[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentParticipantsCount, setCurrentParticipantsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedParticipantForDetail, setSelectedParticipantForDetail] = useState<Participant | null>(null);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [selectedPayerId, setSelectedPayerId] = useState<string | null>(null);
  const [newParticipantNameInExpense, setNewParticipantNameInExpense] = useState('');
  const [participantCoefficients, setParticipantCoefficients] = useState<Record<string, string>>({});

  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [participantName, setParticipantName] = useState('');

  const [advancePaymentModalVisible, setAdvancePaymentModalVisible] = useState(false);
  const [selectedParticipantForAdvance, setSelectedParticipantForAdvance] = useState<Participant | null>(null);
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState('');

  const [lastSelectedPayerId, setLastSelectedPayerId] = useState<string | null>(null);
  const [lastSelectedParticipantIds, setLastSelectedParticipantIds] = useState<string[]>([]);

  const fetchActivityDetail = useCallback(async () => {
    if (!params.id) return;
    if (!isDatabaseReady()) {
      console.log('Database not ready yet, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      const data = await getActivityDetail(params.id);
      if (data) {
        setActivity(data.activity);
        setExpenses(data.expenses);
        setParticipants(data.participants);
        setExpenseParticipants(data.expenseParticipants);
        setTotalAmount(data.totalAmount);
        setCurrentParticipantsCount(data.currentParticipantsCount);
      }
    } catch (error) {
      console.error('Error fetching activity detail:', error);
      Alert.alert('错误', '获取活动详情失败');
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
    if (selectedParticipantIds.length === 0) {
      Alert.alert('提示', '请至少选择一个分摊人');
      return;
    }
    if (!selectedPayerId) {
      Alert.alert('提示', '请选择支付人');
      return;
    }
    if (!params.id) return;

    const expenseParticipantsData = selectedParticipantIds.map(participantId => ({
      participantId,
      coefficient: parseFloat(participantCoefficients[participantId] || '1'),
    }));

    try {
      await createExpense(params.id, {
        amount: Number(expenseAmount),
        description: expenseDescription.trim(),
        payerId: selectedPayerId,
        participants: expenseParticipantsData,
      });

      setLastSelectedPayerId(selectedPayerId);
      setLastSelectedParticipantIds(selectedParticipantIds);

      setExpenseModalVisible(false);
      setExpenseAmount('');
      setExpenseDescription('');
      setSelectedParticipantIds([]);
      setSelectedPayerId(null);
      setParticipantCoefficients({});
      fetchActivityDetail();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('错误', '添加费用失败');
    }
  };

  const openExpenseModal = () => {
    const activeParticipants = participants.filter(p => !p.left_at);
    const activeParticipantIds = activeParticipants.map(p => p.id);

    if (lastSelectedPayerId && activeParticipantIds.includes(lastSelectedPayerId)) {
      setSelectedPayerId(lastSelectedPayerId);
    } else if (activeParticipants.length > 0) {
      setSelectedPayerId(activeParticipants[0].id);
    }

    const validLastSelectedIds = lastSelectedParticipantIds.filter(id => activeParticipantIds.includes(id));
    if (validLastSelectedIds.length > 0) {
      setSelectedParticipantIds(validLastSelectedIds);
    } else {
      setSelectedParticipantIds(activeParticipantIds);
    }

    const initialCoefficients: Record<string, string> = {};
    activeParticipants.forEach(p => {
      initialCoefficients[p.id] = String(p.default_coefficient || 1);
    });
    setParticipantCoefficients(initialCoefficients);

    setNewParticipantNameInExpense('');
    setExpenseModalVisible(true);
  };

  const handleAddParticipantInExpense = async () => {
    if (!newParticipantNameInExpense.trim()) {
      Alert.alert('提示', '请输入参与者姓名');
      return;
    }
    if (!params.id) return;

    try {
      const newParticipant = await createParticipant(params.id, newParticipantNameInExpense.trim());
      await fetchActivityDetail();
      setSelectedParticipantIds(prev => [...prev, newParticipant.id]);
      setNewParticipantNameInExpense('');
      Alert.alert('成功', `已添加参与者 ${newParticipant.name}`);
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert('错误', '添加参与者失败');
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
              if (params.id) {
                await deleteExpense(params.id, expenseId);
                fetchActivityDetail();
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
    if (!params.id) return;

    try {
      await createParticipant(params.id, participantName.trim());
      setParticipantModalVisible(false);
      setParticipantName('');
      fetchActivityDetail();
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert('错误', '添加参与者失败');
    }
  };

  const handleUpdateAdvancePayment = async () => {
    if (!selectedParticipantForAdvance || !params.id) return;

    try {
      await updateParticipant(params.id, selectedParticipantForAdvance.id, {
        advancePayment: advancePaymentAmount.trim() ? Number(advancePaymentAmount) : 0,
      });
      setAdvancePaymentModalVisible(false);
      setAdvancePaymentAmount('');
      setSelectedParticipantForAdvance(null);
      fetchActivityDetail();
    } catch (error) {
      console.error('Error updating advance payment:', error);
      Alert.alert('错误', '更新失败');
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
              if (params.id) {
                await updateParticipant(params.id, participantId, {
                  leftAt: new Date().toISOString(),
                });
                fetchActivityDetail();
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
              if (params.id) {
                await deleteParticipant(params.id, participantId);
                fetchActivityDetail();
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

        {/* 费用记录 */}
        <View style={{ marginBottom: Spacing.xl }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.sectionTitle}>
              费用记录
            </ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={openExpenseModal}>
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
                    {expense.payer_name && ` · ${expense.payer_name}支付`}
                  </ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: Spacing.xs }}>
                  <ThemedText variant="h3" color={theme.primary} style={styles.expenseAmount}>
                    ¥{expense.amount}
                  </ThemedText>
                  <TouchableOpacity onPress={() => handleDeleteExpense(expense.id)}>
                    <FontAwesome6 name="trash" size={14} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))
          )}
        </View>

        {/* 参与者管理 */}
        <View style={{ marginBottom: Spacing.xl }}>
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
                  },
                ]}
              >
                <TouchableOpacity 
                  style={styles.participantRow}
                  onPress={() => {
                    setSelectedParticipantForDetail(participant);
                    setDetailModalVisible(true);
                  }}
                >
                  <View style={[styles.participantAvatar, { backgroundColor: getAvatarColor(participant.name) }]}>
                    <Text style={styles.participantAvatarText}>{getAvatarInitial(participant.name)}</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ThemedText variant="body" color={theme.textPrimary} style={styles.participantName}>
                        {participant.name}
                        {participant.left_at && ' (已离开)'}
                      </ThemedText>
                      <FontAwesome6 name="chevron-right" size={12} color={theme.textMuted} />
                    </View>
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.participantTime}>
                      加入：{formatTime(participant.joined_at)}
                      {participant.left_at && ` | 离开：${formatTime(participant.left_at)}`}
                    </ThemedText>
                    <Text
                      style={[
                        styles.participantBalanceText,
                        participant.balance && participant.balance > 0 ? styles.positiveBalance :
                        participant.balance && participant.balance < 0 ? styles.negativeBalance :
                        styles.neutralBalance
                      ]}
                    >
                      {participant.balance ? (
                        participant.balance > 0 ? `需支付 ¥${participant.balance}` :
                        participant.balance < 0 ? `需退费 ¥${Math.abs(participant.balance)}` : '已结清'
                      ) : '未计算'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.participantActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedParticipantForAdvance(participant);
                      setAdvancePaymentAmount(participant.advance_payment > 0 ? String(participant.advance_payment) : '');
                      setAdvancePaymentModalVisible(true);
                    }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                  >
                    <FontAwesome6 name="coins" size={18} color={theme.primary} />
                  </TouchableOpacity>
                  {!participant.left_at && (
                    <TouchableOpacity
                      onPress={() => handleLeaveParticipant(participant.id)}
                      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                    >
                      <FontAwesome6 name="right-from-bracket" size={18} color="#F59E0B" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteParticipant(participant.id)}
                    style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                  >
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <View style={styles.modalHeader}>
                <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
                  添加费用记录
                </ThemedText>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setExpenseModalVisible(false);
                    setExpenseAmount('');
                    setExpenseDescription('');
                    setSelectedParticipantIds([]);
                    setSelectedPayerId(null);
                  }}
                >
                  <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
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

                {/* 选择分摊人 */}
                <ThemedText variant="body" color={theme.textSecondary} style={styles.selectorLabel}>
                  分摊人（点击取消选择）
                </ThemedText>
                <View style={styles.participantTags}>
                  {participants.filter(p => !p.left_at).map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.participantTag,
                        {
                          backgroundColor: selectedParticipantIds.includes(participant.id)
                            ? theme.primary + '20'
                            : 'transparent',
                          borderColor: selectedParticipantIds.includes(participant.id)
                            ? theme.primary
                            : theme.borderLight,
                        },
                      ]}
                      onPress={() => {
                        setSelectedParticipantIds(prev => {
                          if (prev.includes(participant.id)) {
                            return prev.filter(id => id !== participant.id);
                          } else {
                            return [...prev, participant.id];
                          }
                        });
                      }}
                    >
                      <ThemedText
                        variant="body"
                        color={selectedParticipantIds.includes(participant.id) ? theme.primary : theme.textPrimary}
                        style={styles.participantTagText}
                      >
                        {participant.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 分摊系数设置 */}
                {selectedParticipantIds.length > 0 && (
                  <View style={styles.coefficientSection}>
                    <ThemedText variant="body" color={theme.textSecondary} style={styles.selectorLabel}>
                      分摊系数（如带孩子可设置大于1的系数）
                    </ThemedText>
                    {selectedParticipantIds.map((participantId) => {
                      const participant = participants.find(p => p.id === participantId);
                      if (!participant) return null;
                      return (
                        <View key={participantId} style={styles.coefficientRow}>
                          <ThemedText variant="body" color={theme.textPrimary} style={styles.coefficientName}>
                            {participant.name}
                          </ThemedText>
                          <View style={styles.coefficientInputContainer}>
                            <TouchableOpacity
                              style={[styles.coefficientButton, { backgroundColor: theme.backgroundTertiary }]}
                              onPress={() => {
                                const currentValue = parseFloat(participantCoefficients[participantId] || '1');
                                const newValue = Math.max(0.5, currentValue - 0.5);
                                setParticipantCoefficients(prev => ({
                                  ...prev,
                                  [participantId]: String(newValue),
                                }));
                              }}
                            >
                              <FontAwesome6 name="minus" size={14} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <TextInput
                              style={[
                                styles.coefficientInput,
                                {
                                  backgroundColor: theme.backgroundTertiary,
                                  color: theme.textPrimary,
                                },
                              ]}
                              value={participantCoefficients[participantId] || '1'}
                              onChangeText={(text) => {
                                setParticipantCoefficients(prev => ({
                                  ...prev,
                                  [participantId]: text,
                                }));
                              }}
                              keyboardType="decimal-pad"
                              placeholder="1.0"
                              placeholderTextColor={theme.textMuted}
                            />
                            <TouchableOpacity
                              style={[styles.coefficientButton, { backgroundColor: theme.backgroundTertiary }]}
                              onPress={() => {
                                const currentValue = parseFloat(participantCoefficients[participantId] || '1');
                                const newValue = currentValue + 0.5;
                                setParticipantCoefficients(prev => ({
                                  ...prev,
                                  [participantId]: String(newValue),
                                }));
                              }}
                            >
                              <FontAwesome6 name="plus" size={14} color={theme.textPrimary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.coefficientHint}>
                      系数示例：1人=1，1人+1孩=1.5，1人+2孩=2
                    </ThemedText>
                  </View>
                )}

                {/* 新建参与者 */}
                <View style={styles.addParticipantRow}>
                  <TextInput
                    style={[
                      styles.newParticipantInput,
                      {
                        backgroundColor: theme.backgroundTertiary,
                        borderColor: theme.borderLight,
                        color: theme.textPrimary,
                      },
                    ]}
                    placeholder="新参与者姓名"
                    placeholderTextColor={theme.textMuted}
                    value={newParticipantNameInExpense}
                    onChangeText={setNewParticipantNameInExpense}
                  />
                  <TouchableOpacity
                    style={[styles.addParticipantSmallButton, { backgroundColor: theme.primary }]}
                    onPress={handleAddParticipantInExpense}
                  >
                    <FontAwesome6 name="plus" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* 选择支付人 */}
                <ThemedText variant="body" color={theme.textSecondary} style={styles.selectorLabel}>
                  支付人（单选）
                </ThemedText>
                <View style={styles.payerButtons}>
                  {participants.filter(p => !p.left_at).map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.payerButton,
                        {
                          backgroundColor: selectedPayerId === participant.id
                            ? theme.primary
                            : 'transparent',
                          borderColor: selectedPayerId === participant.id
                            ? theme.primary
                            : theme.borderLight,
                        },
                      ]}
                      onPress={() => setSelectedPayerId(participant.id)}
                    >
                      <ThemedText
                        variant="body"
                        color={selectedPayerId === participant.id ? theme.buttonPrimaryText : theme.textPrimary}
                        style={styles.payerButtonText}
                      >
                        {participant.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setExpenseModalVisible(false);
                    setExpenseAmount('');
                    setExpenseDescription('');
                    setSelectedParticipantIds([]);
                    setSelectedPayerId(null);
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

      {/* 提前支付 Modal */}
      <Modal visible={advancePaymentModalVisible} transparent animationType="slide">
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
                提前支付金额
              </ThemedText>

              <ThemedText variant="body" color={theme.textSecondary} style={styles.inputLabel}>
                {selectedParticipantForAdvance?.name}
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
                value={advancePaymentAmount}
                onChangeText={setAdvancePaymentAmount}
                keyboardType="decimal-pad"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setAdvancePaymentModalVisible(false);
                    setAdvancePaymentAmount('');
                    setSelectedParticipantForAdvance(null);
                  }}
                >
                  <ThemedText variant="body" style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    取消
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.primary }]}
                  onPress={handleUpdateAdvancePayment}
                >
                  <ThemedText variant="body" style={[styles.submitButtonText, { color: theme.buttonPrimaryText }]}>
                    保存
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 支出明细 Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <View style={styles.modalHeader}>
                <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
                  {selectedParticipantForDetail?.name} 的支出明细
                </ThemedText>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setDetailModalVisible(false);
                    setSelectedParticipantForDetail(null);
                  }}
                >
                  <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* 汇总信息 */}
              {selectedParticipantForDetail && (
                <View style={styles.detailSummary}>
                  <View style={styles.detailSummaryRow}>
                    <ThemedText variant="body" color={theme.textSecondary}>已支付：</ThemedText>
                    <ThemedText variant="h3" color={theme.primary}>¥{selectedParticipantForDetail.paidTotal || 0}</ThemedText>
                  </View>
                  <View style={styles.detailSummaryRow}>
                    <ThemedText variant="body" color={theme.textSecondary}>应分摊：</ThemedText>
                    <ThemedText variant="h3" color={theme.textPrimary}>¥{selectedParticipantForDetail.shareTotal || 0}</ThemedText>
                  </View>
                  <View style={styles.detailSummaryRow}>
                    <ThemedText variant="body" color={theme.textSecondary}>预付款：</ThemedText>
                    <ThemedText variant="body" color={theme.textPrimary}>¥{selectedParticipantForDetail.advance_payment || 0}</ThemedText>
                  </View>
                  <View style={[styles.detailSummaryRow, styles.detailSummaryTotal]}>
                    <ThemedText variant="body" color={theme.textSecondary}>余额：</ThemedText>
                    <ThemedText 
                      variant="h2" 
                      color={selectedParticipantForDetail.balance && selectedParticipantForDetail.balance > 0 
                        ? theme.error 
                        : selectedParticipantForDetail.balance && selectedParticipantForDetail.balance < 0 
                          ? theme.success 
                          : theme.textMuted
                      }
                    >
                      {selectedParticipantForDetail.balance && selectedParticipantForDetail.balance > 0 
                        ? `需支付 ¥${selectedParticipantForDetail.balance}` 
                        : selectedParticipantForDetail.balance && selectedParticipantForDetail.balance < 0 
                          ? `需退费 ¥${Math.abs(selectedParticipantForDetail.balance)}` 
                          : '已结清'}
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* 参与的费用列表 */}
              {selectedParticipantForDetail && (
                <>
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.detailListTitle}>
                    参与的费用记录
                  </ThemedText>
                  <ScrollView style={styles.detailScrollView}>
                    {expenses
                      .filter(expense => {
                        const eps = expenseParticipants.filter(ep => ep.expense_id === expense.id);
                        return eps.some(ep => ep.participant_id === selectedParticipantForDetail.id);
                      })
                      .map(expense => {
                        const eps = expenseParticipants.filter(ep => ep.expense_id === expense.id);
                        const myCoeff = eps.find(ep => ep.participant_id === selectedParticipantForDetail.id)?.coefficient || 1;
                        const totalCoeff = eps.reduce((sum, ep) => sum + (ep.coefficient || 1), 0);
                        const myShare = totalCoeff > 0 ? Math.floor(expense.amount * myCoeff / totalCoeff) : 0;

                        return (
                          <View key={expense.id} style={styles.detailItem}>
                            <View style={styles.detailItemHeader}>
                              <ThemedText variant="body" color={theme.textPrimary} style={styles.detailItemDesc}>
                                {expense.description || '未命名费用'}
                              </ThemedText>
                              <ThemedText variant="body" color={theme.primary}>
                                ¥{myShare}
                              </ThemedText>
                            </View>
                            <View style={styles.detailItemInfo}>
                              <ThemedText variant="caption" color={theme.textMuted}>
                                总金额: ¥{expense.amount} | 系数: {myCoeff}
                              </ThemedText>
                            </View>
                          </View>
                        );
                      })}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
