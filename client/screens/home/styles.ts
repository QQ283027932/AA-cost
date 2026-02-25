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
    headerTitle: {
      marginBottom: Spacing.sm,
    },
    headerDescription: {
      marginBottom: Spacing.xl,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    fabIcon: {
      fontSize: 28,
      color: '#fff',
      fontWeight: 'bold',
    },
    card: {
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    cardTitle: {
      flex: 1,
    },
    cardActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    cardMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    cardMetaIcon: {
      fontSize: 14,
    },
    cardMetaText: {
      fontSize: 12,
    },
    participantsSection: {
      paddingTop: Spacing.md,
      borderTopWidth: 1,
    },
    participantsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    participantsTitle: {
      fontSize: 14,
    },
    addParticipantButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    addParticipantButtonText: {
      fontSize: 12,
    },
    participantItem: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    participantHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    participantNameSection: {
      flex: 1,
    },
    participantName: {
      fontSize: 14,
      marginBottom: 2,
    },
    participantBalanceText: {
      fontSize: 12,
      fontWeight: '600',
    },
    participantActions: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    participantDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
    },
    participantDetailItem: {
      flex: 1,
    },
    participantDetailLabel: {
      fontSize: 10,
      color: '#999',
      marginBottom: 2,
    },
    participantDetailValue: {
      fontSize: 12,
      fontWeight: '500',
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    emptyDescription: {
      textAlign: 'center',
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
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
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
