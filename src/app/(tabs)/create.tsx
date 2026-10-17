import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { palette, radii, spacing, typography } from '../../constants/tokens';

export default function CreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>{t('create.title', 'What would you like to post?')}</Text>
        <Badge label="Phase 0 Flow" variant="brand" />
      </View>

      {/* Option 1: Video Reel */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/listing/create')}
      >
        <Card variant="elevated" style={styles.optionCard}>
          <View style={styles.iconCircleBrand}>
            <Text style={styles.iconEmoji}>📹</Text>
          </View>
          <View style={styles.optionContent}>
            <View style={styles.badgeRow}>
              <Text style={styles.optionTitle}>
                {t('create.postReelTitle', 'Post a Video Reel')}
              </Text>
              <Badge label="Featured" variant="brand" />
            </View>
            <Text style={styles.optionDesc}>
              {t(
                'create.postReelDesc',
                'Record or upload up to 60s product showcase video. Video listings get 4x more buyer inquiries.'
              )}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Option 2: Regular Classified Listing */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/listing/create')}
      >
        <Card variant="elevated" style={styles.optionCard}>
          <View style={styles.iconCircleSlate}>
            <Text style={styles.iconEmoji}>📸</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              {t('create.postListingTitle', 'Post a Regular Listing')}
            </Text>
            <Text style={styles.optionDesc}>
              {t('create.postListingDesc', 'Add photos, price, description and location.')}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Phase 0 Engineering Notice */}
      <Card variant="subtle" style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Integration Status</Text>
        <Text style={styles.noticeText}>
          {t(
            'create.phase0Notice',
            'Listing creation and media upload pipelines are scheduled for Phase 1. Real media transcoding and database persistence will be wired to the Node.js + object storage services.'
          )}
        </Text>
      </Card>
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
    flex: 1,
    marginRight: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radii.xl,
  },
  iconCircleBrand: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconCircleSlate: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  optionTitle: {
    ...typography.headline,
    color: palette.slate900,
  },
  optionDesc: {
    ...typography.bodySmall,
    color: palette.slate500,
    marginTop: 2,
    lineHeight: 18,
  },
  noticeCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  noticeTitle: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: spacing.xs,
  },
  noticeText: {
    ...typography.bodySmall,
    color: palette.slate600,
    lineHeight: 18,
  },
});
