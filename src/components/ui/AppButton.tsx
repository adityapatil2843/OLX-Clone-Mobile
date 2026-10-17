import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { palette, radii, spacing } from '../../constants/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...props
}) => {
  const isInteractive = !disabled && !isLoading;

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? palette.slate300 : palette.brand500,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? palette.slate100 : palette.slate800,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? palette.slate300 : palette.brand500,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return palette.slate400;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return palette.pureWhite;
      case 'outline':
      case 'ghost':
        return palette.brand500;
    }
  };

  const getSizeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, minHeight: 34 },
          text: { fontSize: 13, fontWeight: '600' },
        };
      case 'lg':
        return {
          container: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, minHeight: 52 },
          text: { fontSize: 16, fontWeight: '700' },
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 44 },
          text: { fontSize: 14, fontWeight: '600' },
        };
    }
  };

  const sizeStyles = getSizeStyle();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: isLoading }}
      activeOpacity={0.75}
      disabled={!isInteractive}
      style={[
        styles.base,
        sizeStyles.container,
        getContainerStyle(),
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, sizeStyles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
