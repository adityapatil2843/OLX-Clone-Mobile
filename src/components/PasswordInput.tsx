import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { palette, radii, spacing, typography } from '../constants/tokens';

export interface PasswordInputProps extends TextInputProps {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  containerStyle?: ViewStyle;
}

export const PasswordInput = React.memo(
  React.forwardRef<TextInput, PasswordInputProps>(
    (
      {
        label,
        error = false,
        errorMessage,
        containerStyle,
        style,
        onFocus,
        onBlur,
        editable = true,
        placeholderTextColor = palette.slate400,
        ...restProps
      },
      ref
    ) => {
      const [isPasswordVisible, setIsPasswordVisible] = useState(false);
      const [isFocused, setIsFocused] = useState(false);

      const hasError = Boolean(error || errorMessage);

      const handleFocus = (e: any) => {
        setIsFocused(true);
        if (onFocus) {
          onFocus(e);
        }
      };

      const handleBlur = (e: any) => {
        setIsFocused(false);
        if (onBlur) {
          onBlur(e);
        }
      };

      const togglePasswordVisibility = () => {
        setIsPasswordVisible((prev) => !prev);
      };

      return (
        <View style={[styles.container, containerStyle]}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View
            style={[
              styles.inputWrapper,
              isFocused && styles.inputWrapperFocused,
              hasError && styles.inputWrapperError,
              !editable && styles.inputWrapperDisabled,
            ]}
          >
            <TextInput
              ref={ref}
              style={[styles.input, style]}
              placeholderTextColor={placeholderTextColor}
              secureTextEntry={!isPasswordVisible}
              textContentType="password"
              autoComplete="password"
              autoCapitalize="none"
              autoCorrect={false}
              editable={editable}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...restProps}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.eyeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              {isPasswordVisible ? (
                <EyeOff size={20} color={hasError ? palette.danger500 : palette.slate500} />
              ) : (
                <Eye size={20} color={hasError ? palette.danger500 : palette.slate500} />
              )}
            </TouchableOpacity>
          </View>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      );
    }
  )
);

PasswordInput.displayName = 'PasswordInput';

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
  inputWrapperFocused: {
    borderColor: palette.brand600,
  },
  inputWrapperError: {
    borderColor: palette.danger500,
  },
  inputWrapperDisabled: {
    backgroundColor: palette.slate50,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    color: palette.slate900,
    paddingVertical: spacing.sm,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: palette.danger500,
    marginTop: spacing.xs,
  },
});

