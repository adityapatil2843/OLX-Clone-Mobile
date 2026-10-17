import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { palette, spacing, typography } from '../constants/tokens';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: true }} />
      <ScreenContainer scrollable={false}>
        <View style={styles.container}>
          <Text style={styles.icon}>🔍</Text>
          <Text style={styles.title}>{t('errors.notFound', 'Page Not Found')}</Text>
          <Text style={styles.description}>
            The screen you are looking for does not exist or has been moved.
          </Text>
          <Link href="/(tabs)" style={styles.link}>
            <Text style={styles.linkText}>{t('placeholder.backHome', 'Go to Home Screen')}</Text>
          </Link>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleMedium,
    color: palette.slate800,
  },
  description: {
    ...typography.bodyMedium,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  link: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.brand500,
    borderRadius: 8,
  },
  linkText: {
    color: palette.pureWhite,
    fontWeight: '600',
    fontSize: 14,
  },
});
