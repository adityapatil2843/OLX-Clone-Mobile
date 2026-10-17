import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { palette, spacing, typography } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const { setSession } = useAuthStore();

  const handleVerify = () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    // In Phase 0 preview, simulate local test session without claiming backend verification
    setSession({
      id: 'usr_phase0_preview',
      phone: phone || '9876543210',
      name: 'Preview User',
      role: 'consumer',
      isVerified: true,
      city: 'Mumbai',
      state: 'Maharashtra',
      createdAt: new Date().toISOString(),
    });

    router.replace('/(tabs)/account');
  };

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader
        title={t('auth.verifyOtpTitle', 'Verify Phone Number')}
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {t('auth.verifyOtpTitle', 'Verify Phone Number')}
          </Text>
          <Text style={styles.subtitle}>
            {t('auth.verifyOtpSubtitle', {
              phone: phone || 'your phone number',
              defaultValue: `Enter the 6-digit OTP sent to ${phone || 'your phone number'}`,
            })}
          </Text>
        </View>

        <AppInput
          label="6-Digit OTP"
          placeholder="123456"
          value={otp}
          onChangeText={(val) => {
            setOtp(val);
            if (error) setError('');
          }}
          keyboardType="number-pad"
          maxLength={6}
          error={error}
        />

        <AppButton
          title={t('auth.verifyButton', 'Verify & Continue')}
          onPress={handleVerify}
          variant="primary"
          size="lg"
          style={styles.submitButton}
        />

        <Card variant="subtle" style={styles.noticeCard}>
          <Badge label="Phase 0 Test Helper" variant="warning" style={{ marginBottom: 6 }} />
          <Text style={styles.noticeText}>
            Enter any 6-digit number to preview the logged-in state locally. Real SMS delivery will be enabled with the OTP provider in Phase 1.
          </Text>
        </Card>
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
    color: palette.slate900,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: palette.slate500,
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  noticeCard: {
    marginTop: spacing.xxl,
    padding: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: palette.slate600,
    lineHeight: 18,
  },
});
