import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { palette, radii, spacing, typography } from '../../constants/tokens';

export type BadgeVariant = 'success' | 'warning' | 'info' | 'brand' | 'default';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'success':
        return {
          container: { backgroundColor: palette.teal50 },
          text: { color: palette.teal600 },
        };
      case 'warning':
        return {
          container: { backgroundColor: palette.brand50 },
          text: { color: palette.brand600 },
        };
      case 'info':
        return {
          container: { backgroundColor: palette.slate100 },
          text: { color: palette.slate700 },
        };
      case 'brand':
        return {
          container: { backgroundColor: palette.brand100 },
          text: { color: palette.brand700 },
        };
      case 'default':
      default:
        return {
          container: { backgroundColor: palette.slate100 },
          text: { color: palette.slate600 },
        };
    }
  };

  const badgeTheme = getBadgeStyle();

  return (
    <View style={[styles.badge, badgeTheme.container, style]}>
      <Text style={[styles.text, badgeTheme.text, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.badge,
  },
});
