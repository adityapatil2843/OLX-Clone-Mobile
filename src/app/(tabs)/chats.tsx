import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { palette, spacing, typography } from '../../constants/tokens';

export default function ChatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('chats.title', 'Messages')}</Text>
        <Badge label="Phase 0 Ready" variant="info" />
      </View>

      <EmptyState
        title={t('chats.emptyTitle', 'No chats yet')}
        description={t(
          'chats.emptyDesc',
          'When you contact sellers or buyers message you, your conversations will appear here in real-time.'
        )}
        actionTitle={t('chats.startExploring', 'Explore Listings')}
        onActionPress={() => router.push('/(tabs)')}
        icon={<Text style={styles.emptyIcon}>✉</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  title: {
    ...typography.titleMedium,
    color: palette.slate900,
  },
  emptyIcon: {
    fontSize: 48,
    color: palette.slate300,
  },
});
