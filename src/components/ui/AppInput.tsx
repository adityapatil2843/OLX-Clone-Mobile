import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { palette, radii, spacing, typography } from '../../constants/tokens';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  leftAccessory,
  rightAccessory,
  containerStyle,
  style,
  ...props
}) => {
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
        {leftAccessory && <View style={styles.accessoryLeft}>{leftAccessory}</View>}
        <TextInput
          placeholderTextColor={palette.slate400}
          style={[styles.input, style]}
          {...props}
        />
        {rightAccessory && <View style={styles.accessoryRight}>{rightAccessory}</View>}
      </View>
      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: palette.slate700,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  inputWrapperError: {
    borderColor: palette.danger500,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    color: palette.slate900,
    paddingVertical: spacing.sm,
  },
  accessoryLeft: {
    marginRight: spacing.sm,
  },
  accessoryRight: {
    marginLeft: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: palette.danger500,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    color: palette.slate500,
    marginTop: spacing.xs,
  },
});
