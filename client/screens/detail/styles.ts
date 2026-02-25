import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing["5xl"],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      width: 100,
    },
    backIcon: {
      marginRight: Spacing.sm,
    },
    backText: {
      fontSize: 16,
    },
    activityTitle: {
      marginBottom: Spacing.sm,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    activityMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    activityMetaIcon: {
      fontSize: 14,
    },
    activityMetaText: {
      fontSize: 12,
    },
    summaryCard: {
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    summaryTitle: {
      marginBottom: Spacing.sm,
    },
    amountPerPerson: {
      marginBottom: Spacing.xs,
    },
    amountLabel: {
      marginBottom: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      marginBottom: 0,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    addButtonText: {
      fontSize: 14,
    },
    expenseItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    expenseInfo: {
      flex: 1,
      marginRight: Spacing.md,
    },
    expenseDescription: {
      fontSize: 16,
      marginBottom: Spacing.xs,
    },
    expenseDate: {
      fontSize: 12,
    },
    expenseAmount: {
      fontSize: 18,
    },
    expenseActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    participantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    participantInfo: {
      flex: 1,
      marginRight: Spacing.md,
    },
    participantName: {
      fontSize: 16,
      marginBottom: Spacing.xs,
    },
    participantTime: {
      fontSize: 12,
      marginBottom: 2,
    },
    participantBalanceText: {
      fontSize: 12,
      fontWeight: '600',
    },
    positiveBalance: {
      color: '#EF4444',
    },
    negativeBalance: {
      color: '#10B981',
    },
    neutralBalance: {
      color: '#6B7280',
    },
    participantAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    participantAvatarText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
    },
    participantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    participantActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    emptyState: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: Spacing.xl,
      maxHeight: '90%',
    },
    modalTitle: {
      marginBottom: Spacing.xl,
    },
    inputLabel: {
      marginBottom: Spacing.sm,
    },
    textInput: {
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    selectorLabel: {
      marginBottom: Spacing.sm,
      fontSize: 14,
    },
    selectorContainer: {
      marginBottom: Spacing.md,
    },
    selectorTitle: {
      marginBottom: Spacing.sm,
      fontSize: 14,
      fontWeight: 'bold',
    },
    participantTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    participantTag: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    participantTagText: {
      fontSize: 14,
    },
    participantTagRemove: {
      fontSize: 14,
    },
    addParticipantRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    newParticipantInput: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      fontSize: 14,
    },
    addParticipantSmallButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    payerButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    payerButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      minWidth: 80,
      alignItems: 'center',
    },
    payerButtonText: {
      fontSize: 14,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    cancelButtonText: {
      color: '#666',
    },
    submitButton: {
      backgroundColor: '#4F46E5',
    },
    submitButtonText: {
      color: '#fff',
    },
  });
};
