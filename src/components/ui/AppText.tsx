import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { typography, palette } from '../../constants/tokens';

export type TextVariant =
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'headline'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'caption'
  | 'badge';

export interface AppTextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'bodyMedium',
  color = palette.slate900,
  weight,
  align,
  style,
  children,
  ...props
}) => {
  const variantStyle = typography[variant];

  return (
    <RNText
      style={[
        variantStyle,
        { color },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};
