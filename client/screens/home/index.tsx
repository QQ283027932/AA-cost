import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
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
  shareTotal: number;
  paidTotal: number;
  advancePayment: number;
  payableAmount: number;
  balance: number;
}

interface Activity {
  id: string;
  title: string;
  totalAmount: number;
  participantsCount: number;
}

export default function HomePage() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [participantsMap, setParticipantsMap] = useState<Record<string, Participant[]>>({});
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');

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

  const fetchParticipants = useCallback(async (activityId: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：GET /api/v1/activities/:id
       * Path 参数：id: string
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${activityId}`);
      const data = await response.json();

      if (response.ok) {
        setParticipantsMap(prev => ({
          ...prev,
          [activityId]: data.participants || [],
        }));
      } else {
        console.error('Failed to fetch participants:', data.error);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  const toggleExpand = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
        if (!participantsMap[activityId]) {
          fetchParticipants(activityId);
        }
      }
      return newSet;
    });
  };

  const handleCreateActivity = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入活动名称');
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：POST /api/v1/activities
       * Body 参数：title: string
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalVisible(false);
        setTitle('');
        fetchActivities();
        // 创建活动后立即打开添加参与者 Modal
        setSelectedActivityId(data.activity.id);
        setParticipantModalVisible(true);
      } else {
        Alert.alert('错误', data.error || '创建活动失败');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      Alert.alert('错误', '创建活动失败');
    }
  };

  const [participantModalVisible, setParticipantModalVisible] = useState(false);

  const handleAddParticipant = async () => {
    if (!participantName.trim()) {
      Alert.alert('提示', '请输入参与者姓名');
      return;
    }
    if (!selectedActivityId) {
      Alert.alert('错误', '活动ID不存在');
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
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${selectedActivityId}/participants`,
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
        setSelectedActivityId(null);
        fetchParticipants(selectedActivityId);
        fetchActivities();
      } else {
        Alert.alert('错误', data.error || '添加参与者失败');
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert('错误', '添加参与者失败');
    }
  };

  const handleDeleteParticipant = (activityId: string, participantId: string) => {
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
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${activityId}/participants/${participantId}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                fetchParticipants(activityId);
                fetchActivities();
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

  const handleLeaveParticipant = (activityId: string, participantId: string) => {
    Alert.alert(
      '确认离开',
      '确定要标记这位参与者已经离开吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            console.log('开始更新参与者状态', activityId, participantId);
            try {
              /**
               * 服务端文件：server/src/routes/activities.ts
               * 接口：PATCH /api/v1/activities/:id/participants/:participantId
               * Path 参数：id: string, participantId: string
               * Body 参数：leftAt: string
               */
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${activityId}/participants/${participantId}`,
                {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    leftAt: new Date().toISOString(),
                  }),
                }
              );

              console.log('更新参与者响应状态', response.status);
              const data = await response.json();
              console.log('更新参与者响应数据', data);

              if (response.ok) {
                console.log('更新成功，刷新数据');
                await fetchParticipants(activityId);
                await fetchActivities();
                Alert.alert('成功', '已标记为离开');
              } else {
                console.error('更新失败', data.error);
                Alert.alert('错误', data.error || '操作失败');
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

  const handleToggleParticipantStatus = async (activityId: string, participantId: string, currentStatus: string | null) => {
    const isLeaving = currentStatus === null;

    try {
      /**
       * 服务端文件：server/src/routes/activities.ts
       * 接口：PATCH /api/v1/activities/:id/participants/:participantId
       * Path 参数：id: string, participantId: string
       * Body 参数：leftAt: string | null
       */
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${activityId}/participants/${participantId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leftAt: isLeaving ? new Date().toISOString() : null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchParticipants(activityId);
        await fetchActivities();
        Alert.alert('成功', isLeaving ? '已标记为离开' : '已重新加入');
      } else {
        Alert.alert('错误', data.error || '操作失败');
      }
    } catch (error) {
      console.error('Error toggling participant status:', error);
      Alert.alert('错误', '操作失败');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) {
      return `需支付 ¥${balance}`;
    } else if (balance < 0) {
      return `需退费 ¥${Math.abs(balance)}`;
    } else {
      return '已结清';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return theme.textPrimary;
    if (balance < 0) return theme.success;
    return theme.textSecondary;
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h1" color={theme.textPrimary} style={styles.headerTitle}>
            A一下
          </ThemedText>
        </ThemedView>

        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyIcon, { color: theme.textMuted }]}>📊</ThemedText>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.emptyTitle}>
              暂无活动
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.emptyDescription}>
              点击右下角 + 号创建第一个活动
            </ThemedText>
          </View>
        ) : (
          activities.map((activity) => {
            const isExpanded = expandedActivities.has(activity.id);
            const participants = participantsMap[activity.id] || [];

            return (
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
                  <TouchableOpacity style={styles.cardTitle} onPress={() => toggleExpand(activity.id)}>
                    <ThemedText variant="h3" color={theme.textPrimary}>
                      {activity.title}
                    </ThemedText>
                  </TouchableOpacity>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => router.push(`/detail`, { id: activity.id })}>
                      <FontAwesome6 name="pen-to-square" size={20} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteActivity(activity.id)}>
                      <FontAwesome6 name="trash" size={20} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  <View style={styles.cardMetaItem}>
                    <FontAwesome6 name="coins" size={14} color={theme.primary} style={styles.cardMetaIcon} />
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.cardMetaText}>
                      总支出 ¥{activity.totalAmount}
                    </ThemedText>
                  </View>
                  <View style={styles.cardMetaItem}>
                    <FontAwesome6 name="users" size={14} color={theme.primary} style={styles.cardMetaIcon} />
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.cardMetaText}>
                      {activity.participantsCount} 人
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => toggleExpand(activity.id)}>
                    <FontAwesome6 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={14} 
                      color={theme.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View style={[styles.participantsSection, { borderTopColor: theme.borderLight }]}>
                    <View style={styles.participantsHeader}>
                      <ThemedText variant="body" color={theme.textPrimary} style={styles.participantsTitle}>
                        参与者
                      </ThemedText>
                      <TouchableOpacity 
                        style={styles.addParticipantButton}
                        onPress={() => {
                          setSelectedActivityId(activity.id);
                          setParticipantModalVisible(true);
                        }}
                      >
                        <FontAwesome6 name="plus" size={12} color={theme.primary} />
                        <ThemedText style={[styles.addParticipantButtonText, { color: theme.primary }]}>
                          添加
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    {participants.length === 0 ? (
                      <ThemedText variant="caption" color={theme.textMuted}>
                        暂无参与者
                      </ThemedText>
                    ) : (
                      participants.map((participant) => (
                        <ThemedView
                          key={participant.id}
                          level="tertiary"
                          style={[
                            styles.participantItem,
                            {
                              backgroundColor: theme.backgroundTertiary,
                            },
                          ]}
                        >
                          <View style={styles.participantHeader}>
                            <View style={styles.participantNameSection}>
                              <ThemedText variant="body" color={theme.textPrimary} style={styles.participantName}>
                                {participant.name}
                              </ThemedText>
                              <TouchableOpacity
                                style={[
                                  styles.statusBadge,
                                  participant.left_at ? styles.statusLeft : styles.statusActive
                                ]}
                                onPress={() => handleToggleParticipantStatus(activity.id, participant.id, participant.left_at)}
                              >
                                <ThemedText
                                  variant="caption"
                                  style={[
                                    styles.statusText,
                                    participant.left_at ? { color: theme.textMuted } : { color: '#10B981' }
                                  ]}
                                >
                                  {participant.left_at ? '已离开' : '在活动'}
                                </ThemedText>
                              </TouchableOpacity>
                              <Text
                                style={[
                                  styles.participantBalanceText,
                                  participant.balance > 0 ? styles.positiveBalance :
                                  participant.balance < 0 ? styles.negativeBalance :
                                  styles.neutralBalance
                                ]}
                              >
                                {participant.balance > 0 ? `需支付 ¥${participant.balance}` :
                                 participant.balance < 0 ? `需退费 ¥${Math.abs(participant.balance)}` : '已结清'}
                              </Text>
                            </View>
                            <View style={styles.participantActions}>
                              {participant.left_at ? (
                                <TouchableOpacity
                                  onPress={() => handleToggleParticipantStatus(activity.id, participant.id, participant.left_at)}
                                  style={[styles.participantActionButton, styles.rejoinButton]}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <FontAwesome6 name="rotate-left" size={16} color="#10B981" />
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => handleToggleParticipantStatus(activity.id, participant.id, participant.left_at)}
                                  style={styles.participantActionButton}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <FontAwesome6 name="right-from-bracket" size={16} color="#F59E0B" />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                onPress={() => handleDeleteParticipant(activity.id, participant.id)}
                                style={styles.participantActionButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <FontAwesome6 name="trash" size={16} color={theme.error} />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={[styles.participantDetails, { borderTopColor: theme.borderLight }]}>
                            <View style={styles.participantDetailItem}>
                              <Text style={styles.participantDetailLabel}>分摊金额</Text>
                              <Text style={styles.participantDetailValue}>¥{participant.shareTotal}</Text>
                            </View>
                            <View style={styles.participantDetailItem}>
                              <Text style={styles.participantDetailLabel}>支付总额</Text>
                              <Text style={styles.participantDetailValue}>¥{participant.paidTotal}</Text>
                            </View>
                          </View>
                        </ThemedView>
                      ))
                    )}
                  </View>
                )}
              </ThemedView>
            );
          })
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

      {/* 创建活动 Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.backgroundDefault,
              },
            ]}
          >
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
              创建新活动
            </ThemedText>

            <ThemedText variant="body" color={theme.textSecondary} style={styles.inputLabel}>
              活动名称
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
              placeholder="例如：周末聚餐"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setTitle('');
                }}
              >
                <ThemedText variant="body" style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                  取消
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateActivity}
              >
                <ThemedText variant="body" style={[styles.submitButtonText, { color: theme.buttonPrimaryText }]}>
                  创建
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 添加参与者 Modal */}
      <Modal visible={participantModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
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
                  setSelectedActivityId(null);
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
      </Modal>
    </Screen>
  );

  function handleDeleteActivity(activityId: string) {
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
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/activities/${activityId}`,
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
  }
}
