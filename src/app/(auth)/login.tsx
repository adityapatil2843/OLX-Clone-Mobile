import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { authService } from '../../services/auth.service';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authService.login({ email: email.trim(), password });
      router.replace('/(tabs)/account');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authService.requestOtp({
        email: email.trim(),
        purpose: 'LOGIN',
      });

      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: email.trim(),
          purpose: 'LOGIN',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader title="Sign In" onBack={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.brandLogo}>olx</Text>
          <Text style={styles.title}>{t('auth.loginTitle', 'Welcome Back')}</Text>
          <Text style={styles.subtitle}>
            Sign in to access your saved listings, chats, and posted ads.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Tab switcher: Password vs OTP */}
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeTab, authMode === 'password' && styles.modeTabActive]}
            onPress={() => {
              setAuthMode('password');
              setError('');
            }}
          >
            <Text style={[styles.modeTabText, authMode === 'password' && styles.modeTabTextActive]}>
              Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, authMode === 'otp' && styles.modeTabActive]}
            onPress={() => {
              setAuthMode('otp');
              setError('');
            }}
          >
            <Text style={[styles.modeTabText, authMode === 'otp' && styles.modeTabTextActive]}>
              Email OTP
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'password' ? (
          <View>
            <AppInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (error) setError('');
              }}
              secureTextEntry
            />

            <AppButton
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handlePasswordLogin}
              disabled={isLoading}
              variant="primary"
              size="lg"
              style={styles.submitButton}
            />
          </View>
        ) : (
          <View>
            <AppInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppButton
              title={isLoading ? 'Sending OTP...' : 'Send Verification OTP'}
              onPress={handleRequestOtp}
              disabled={isLoading}
              variant="primary"
              size="lg"
              style={styles.submitButton}
            />
          </View>
        )}

        {/* Register CTA */}
        <View style={styles.registerPrompt}>
          <Text style={styles.registerPromptText}>{"Don't have an account? "}</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleContainer: {
    marginBottom: spacing.lg,
  },
  brandLogo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#002f34',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleLarge,
    color: palette.slate900,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: palette.slate500,
    marginTop: spacing.xs,
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
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: palette.slate100,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  modeTabActive: {
    backgroundColor: palette.pureWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate500,
  },
  modeTabTextActive: {
    color: '#002f34',
    fontWeight: '700',
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: '#002f34',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerPromptText: {
    fontSize: 14,
    color: palette.slate600,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.brand600,
  },
});
