import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AppButton } from '../../components/ui/AppButton';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Locale } from '../../types/common';

const LANGUAGES: { code: Locale; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale, setLocale } = useAppStore();
  const { isAuthenticated, user, clearSession } = useAuthStore();

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>{t('account.title', 'My Account')}</Text>
        <Badge label={t('account.phase0Badge', 'Phase 0 Foundation')} variant="brand" />
      </View>

      {/* User Status Card */}
      <Card variant="elevated" style={styles.userCard}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {isAuthenticated && user?.name ? user.name[0].toUpperCase() : '👤'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {isAuthenticated && user?.name
                ? user.name
                : t('account.notLoggedIn', 'Guest User')}
            </Text>
            <Text style={styles.userStatus}>
              {isAuthenticated
                ? user?.phone || 'Verified User'
                : 'Browse freely • Sign in to save & post'}
            </Text>
          </View>
        </View>

        {!isAuthenticated ? (
          <AppButton
            title={t('account.loginCta', 'Login / Register')}
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            size="md"
            style={styles.loginButton}
          />
        ) : (
          <AppButton
            title="Log Out"
            onPress={clearSession}
            variant="outline"
            size="sm"
            style={styles.loginButton}
          />
        )}
      </Card>

      {/* Language Switcher Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account.language', 'App Language')}</Text>
        <View style={styles.languageContainer}>
          {LANGUAGES.map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  isSelected && styles.languageOptionSelected,
                ]}
                onPress={() => setLocale(lang.code)}
              >
                <Text
                  style={[
                    styles.languageNative,
                    isSelected && styles.languageTextSelected,
                  ]}
                >
                  {lang.nativeName}
                </Text>
                <Text
                  style={[
                    styles.languageLabel,
                    isSelected && styles.languageTextSelected,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Settings & Info Links */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuTitle}>{t('account.settings', 'Settings')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/self')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuTitle}>Public Profile Preview</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.titleMedium,
    color: palette.slate900,
  },
  userCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.xl,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.brand200,
  },
  avatarText: {
    fontSize: 22,
    color: palette.brand600,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.titleSmall,
    color: palette.slate900,
  },
  userStatus: {
    ...typography.caption,
    color: palette.slate500,
    marginTop: 2,
  },
  loginButton: {
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: spacing.sm,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageOption: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
  },
  languageOptionSelected: {
    borderColor: palette.brand500,
    backgroundColor: palette.brand50,
  },
  languageNative: {
    ...typography.headline,
    color: palette.slate800,
  },
  languageLabel: {
    ...typography.caption,
    color: palette.slate500,
    marginTop: 2,
  },
  languageTextSelected: {
    color: palette.brand700,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.slate100,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  menuTitle: {
    ...typography.bodyMedium,
    color: palette.slate800,
    flex: 1,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: palette.slate400,
  },
});
