import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from './ScreenContainer';
import { AppHeader } from './AppHeader';
import { AppButton } from './AppButton';
import { Badge } from './Badge';
import { palette, spacing, typography } from '../../constants/tokens';

export interface PlaceholderScreenProps {
  title: string;
  featureName: string;
  phase?: string;
  description?: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  featureName,
  phase = 'Phase 1',
  description,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader
        title={title}
        onBack={router.canGoBack() ? () => router.back() : undefined}
      />
      <View style={styles.content}>
        <Badge
          label={`Scheduled for ${phase}`}
          variant="warning"
          style={styles.badge}
        />
        <Text style={styles.title}>{featureName}</Text>
        <Text style={styles.description}>
          {description ||
            t(
              'placeholder.notImplementedDesc',
              'This screen is part of the target marketplace architecture and will be functional when backend services connect in Phase 1.'
            )}
        </Text>
        <AppButton
          title={t('placeholder.backHome', 'Back to Home')}
          onPress={() => router.replace('/(tabs)')}
          variant="secondary"
          size="md"
          style={styles.cta}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  badge: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleMedium,
    color: palette.slate800,
    textAlign: 'center',
  },
  description: {
    ...typography.bodyMedium,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.xxl,
    minWidth: 160,
  },
});
