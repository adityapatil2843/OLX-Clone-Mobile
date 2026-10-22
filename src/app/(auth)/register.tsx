import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { authService } from '../../services/auth.service';

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please provide your name, email, and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        locationCity: city.trim() || undefined,
        locationState: state.trim() || undefined,
      });

      router.replace('/(tabs)/account');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check the details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader title="Create Account" onBack={() => router.back()} />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Join Mandi Live</Text>
          <Text style={styles.subtitle}>
            {"Connect with millions of buyers & sellers in India's video marketplace."}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AppInput
          label="Full Name *"
          placeholder="e.g. Rahul Sharma"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (error) setError('');
          }}
        />

        <AppInput
          label="Email Address *"
          placeholder="rahul@example.com"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppInput
          label="Password (min 8 characters) *"
          placeholder="Create a secure password"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (error) setError('');
          }}
          secureTextEntry
        />

        <AppInput
          label="Mobile Phone (Optional)"
          placeholder="+919876543210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <View style={styles.rowInputs}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <AppInput label="City" placeholder="e.g. Pune" value={city} onChangeText={setCity} />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput label="State" placeholder="e.g. Maharashtra" value={state} onChangeText={setState} />
          </View>
        </View>

        <AppButton
          title={isLoading ? 'Creating Account...' : 'Register'}
          onPress={handleRegister}
          disabled={isLoading}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />

        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleContainer: {
    marginBottom: spacing.lg,
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
  rowInputs: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: spacing.md,
    backgroundColor: '#002f34',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginPromptText: {
    fontSize: 14,
    color: palette.slate600,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.brand600,
  },
});
