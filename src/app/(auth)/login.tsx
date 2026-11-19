import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { PasswordInput } from '../../components/PasswordInput';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { authService } from '../../services/auth.service';
import { ArrowLeft } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();

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

  return (
    <ScreenContainer scrollable>
      <AppHeader 
      title="Sign In" 
      onBack={() => router.back()}
      left={<ArrowLeft size={24} color="#000000ff" />} 
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('auth.loginTitle', 'Welcome to Bazarr 360')}</Text>
          <Text style={styles.subtitle}>
            Sign in to access your saved listings, chats, and posted ads.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (error) setError('');
            }}
            autoComplete="password"
            textContentType="password"
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
  logoImage: {
    width: 140,
    height: 50,
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
