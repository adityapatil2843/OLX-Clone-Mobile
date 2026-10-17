import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { palette, spacing, typography } from '../../constants/tokens';
import { AppButton } from './AppButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryTitle?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryTitle = 'Try Again',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.errorIconCircle}>
        <Text style={styles.errorExclamation}>!</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry && (
        <AppButton
          title={retryTitle}
          onPress={onRetry}
          variant="outline"
          size="md"
          style={styles.retryButton}
        />
      )}
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
  errorIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.danger50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorExclamation: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.danger500,
  },
  title: {
    ...typography.titleSmall,
    color: palette.slate800,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: spacing.xl,
    minWidth: 140,
  },
});
