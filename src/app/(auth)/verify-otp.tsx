import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { authService } from '../../services/auth.service';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email, phone, purpose } = useLocalSearchParams<{
    email?: string;
    phone?: string;
    purpose?: string;
  }>();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const displayTarget = email || phone || 'your contact address';

  const handleVerify = async () => {
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await authService.verifyOtp({
        email: email || `${phone}@example.com`,
        otp: otp.trim(),
        purpose: (purpose as any) || 'REGISTRATION',
      });

      if (result.user) {
        router.replace('/(tabs)/account');
      } else {
        // OTP verified for new account registration
        router.replace({
          pathname: '/(auth)/register',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. The code may be incorrect or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader
        title={t('auth.verifyOtpTitle', 'Verify Code')}
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {t('auth.verifyOtpTitle', 'Verification Code')}
          </Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to {displayTarget}.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppInput
          label="6-Digit OTP Code"
          placeholder="123456"
          value={otp}
          onChangeText={(val) => {
            setOtp(val);
            if (error) setError('');
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <AppButton
          title={isLoading ? 'Verifying...' : 'Verify & Continue'}
          onPress={handleVerify}
          disabled={isLoading || otp.trim().length !== 6}
          variant="primary"
          size="lg"
          style={styles.submitButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  titleContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.titleLarge,
    color: '#002f34',
    fontWeight: '800',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: palette.slate500,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: palette.danger50,
    borderWidth: 1,
    borderColor: palette.danger500,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: palette.danger600,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: '#002f34',
  },
});
