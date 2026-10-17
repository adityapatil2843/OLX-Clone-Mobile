import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { palette, spacing, typography } from '../../constants/tokens';
import { AppButton } from './AppButton';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onActionPress,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionTitle && onActionPress ? (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="md"
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleSmall,
    color: palette.slate800,
    textAlign: 'center',
  },
  description: {
    ...typography.bodyMedium,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
