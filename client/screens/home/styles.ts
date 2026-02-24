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
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    cardTitle: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
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
  });
};
