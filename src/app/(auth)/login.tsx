import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { palette, spacing, typography } from '../../constants/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    router.push({
      pathname: '/(auth)/verify-otp',
      params: { phone },
    });
  };

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader
        title="Sign In"
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('auth.loginTitle', 'Welcome to Mandi Live')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.loginSubtitle', 'Enter your 10-digit mobile number to continue')}
          </Text>
        </View>

        <AppInput
          label={t('auth.phoneNumberLabel', 'Phone Number')}
          placeholder="98765 43210"
          value={phone}
          onChangeText={(val) => {
            setPhone(val);
            if (error) setError('');
          }}
          keyboardType="phone-pad"
          maxLength={10}
          leftAccessory={<Text style={styles.countryCode}>+91</Text>}
          error={error}
        />

        <AppButton
          title={t('auth.sendOtp', 'Send OTP')}
          onPress={handleSendOtp}
          variant="primary"
          size="lg"
          style={styles.submitButton}
        />

        {/* Phase 0 Notice */}
        <Card variant="subtle" style={styles.noticeCard}>
          <Badge label="Phase 0 Preview" variant="warning" style={{ marginBottom: 6 }} />
          <Text style={styles.noticeText}>
            {t(
              'auth.phase0Notice',
              'Authentication is in Phase 0 preview. Real SMS OTP delivery and secure mobile session persistence will be connected in Phase 1.'
            )}
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
  countryCode: {
    ...typography.headline,
    color: palette.slate700,
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
