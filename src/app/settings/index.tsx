import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { palette, spacing, typography } from '../../constants/tokens';
import { useAppStore } from '../../stores/useAppStore';
import { env } from '../../config/env';
import { Locale } from '../../types/common';

const CITIES = ['All India', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune', 'Hyderabad', 'Ahmedabad', 'Chennai'];

const LANGUAGES: { code: Locale; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale, setLocale, selectedCity, setSelectedCity } = useAppStore();

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title={t('account.settings', 'Settings')}
        onBack={() => router.back()}
      />

      {/* Select Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.locationSelector', 'Select Location')}</Text>
        <View style={styles.chipRow}>
          {CITIES.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <TouchableOpacity
                key={city}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCity(city)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {city}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account.language', 'App Language')}</Text>
        <Card variant="outlined" style={styles.langCard}>
          {LANGUAGES.map((item) => {
            const isSelected = locale === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.langRow, isSelected && styles.langRowSelected]}
                onPress={() => setLocale(item.code)}
              >
                <View>
                  <Text style={styles.langNative}>{item.nativeName}</Text>
                  <Text style={styles.langLabel}>{item.label}</Text>
                </View>
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>

      {/* App & Diagnostic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Diagnostics</Text>
        <Card variant="subtle">
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>App Name</Text>
            <Text style={styles.diagValue}>{env.APP_NAME}</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Environment</Text>
            <Badge label={env.APP_ENV} variant="info" />
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>API Base URL</Text>
            <Text style={styles.diagValue} numberOfLines={1}>{env.API_BASE_URL}</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Phase Status</Text>
            <Badge label="Phase 0 Complete" variant="success" />
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.pureWhite,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.slate200,
  },
  chipSelected: {
    borderColor: palette.brand500,
    backgroundColor: palette.brand50,
  },
  chipText: {
    ...typography.bodySmall,
    color: palette.slate700,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: palette.brand700,
    fontWeight: '700',
  },
  langCard: {
    padding: 0,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  langRowSelected: {
    backgroundColor: palette.brand50,
  },
  langNative: {
    ...typography.headline,
    color: palette.slate900,
  },
  langLabel: {
    ...typography.caption,
    color: palette.slate500,
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.brand600,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  diagLabel: {
    ...typography.bodySmall,
    color: palette.slate500,
  },
  diagValue: {
    ...typography.bodySmall,
    color: palette.slate800,
    fontWeight: '600',
    maxWidth: 200,
  },
});
