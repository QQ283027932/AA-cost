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
    participantsSection: {
      marginBottom: Spacing.xl,
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
    participantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    participantInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    participantAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    participantAvatarText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
    },
    participantName: {
      fontSize: 16,
    },
    participantActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    emptyParticipants: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    emptyParticipantsText: {
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
      marginBottom: Spacing["2xl"],
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
