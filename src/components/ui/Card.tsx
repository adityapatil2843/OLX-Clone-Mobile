import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { palette, radii, spacing, shadows } from '../../constants/tokens';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'subtle';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  style,
  ...props
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: palette.pureWhite,
          ...shadows.sm,
          borderWidth: 1,
          borderColor: palette.slate100,
        };
      case 'outlined':
        return {
          backgroundColor: palette.pureWhite,
          borderWidth: 1.5,
          borderColor: palette.slate200,
        };
      case 'subtle':
        return {
          backgroundColor: palette.slate100,
          borderWidth: 0,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginVertical: spacing.xs,
  },
});
