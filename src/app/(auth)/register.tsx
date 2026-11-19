import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { PasswordInput } from '../../components/PasswordInput';
import { LocationPicker } from '../../components/ui/LocationPicker';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { authService } from '../../services/auth.service';
import { ArrowLeft } from 'lucide-react-native';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Full name is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      city: '',
      state: '',
    },
    mode: 'onTouched',
  });

  const selectedState = useWatch({ control, name: 'state' }) || '';
  const selectedCity = useWatch({ control, name: 'city' }) || '';

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    try {
      await authService.register({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone?.trim() || undefined,
        locationCity: data.city?.trim() || undefined,
        locationState: data.state?.trim() || undefined,
      });

      router.replace('/(tabs)/account');
    } catch (err: any) {
      setServerError(
        err.message || 'Registration failed. Please check the details and try again.'
      );
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Create Account"
        onBack={() => router.back()}
        left={<ArrowLeft size={24} color="#000000ff" />}
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Join Bazarr 360</Text>
          <Text style={styles.subtitle}>
            {"Connect with millions of buyers & sellers in India's video marketplace."}
          </Text>
        </View>

        {serverError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={value}
              onBlur={onBlur}
              onChangeText={(val) => {
                onChange(val);
                if (serverError) setServerError('');
              }}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Email Address *"
              placeholder="rahul@example.com"
              value={value}
              onBlur={onBlur}
              onChangeText={(val) => {
                onChange(val);
                if (serverError) setServerError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <PasswordInput
              ref={ref}
              label="Password (min 8 characters) *"
              placeholder="Create a secure password"
              value={value}
              onBlur={onBlur}
              onChangeText={(val) => {
                onChange(val);
                if (serverError) setServerError('');
              }}
              autoComplete="new-password"
              error={Boolean(errors.password)}
              errorMessage={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <PasswordInput
              ref={ref}
              label="Confirm Password *"
              placeholder="Re-enter your password"
              value={value}
              onBlur={onBlur}
              onChangeText={(val) => {
                onChange(val);
                if (serverError) setServerError('');
              }}
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              errorMessage={errors.confirmPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Mobile Phone (Optional)"
              placeholder="+919876543210"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
          )}
        />

        <LocationPicker
          selectedState={selectedState}
          selectedDistrict={selectedCity}
          onStateChange={(val) => {
            setValue('state', val, { shouldValidate: true, shouldDirty: true });
            if (serverError) setServerError('');
          }}
          onDistrictChange={(val) => {
            setValue('city', val, { shouldValidate: true, shouldDirty: true });
            if (serverError) setServerError('');
          }}
        />

        <AppButton
          title={isSubmitting ? 'Creating Account...' : 'Register'}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
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
