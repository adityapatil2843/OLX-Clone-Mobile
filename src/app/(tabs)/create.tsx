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
    <ScreenContainer scrollable hasBottomTab>
      <View style={styles.header}>
        <Text style={styles.title}>{t('create.title', 'What would you like to post?')}</Text>
      </View>

      {/* Option 1: Video Reel */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/listing/create', params: { type: 'reel' } })}
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
              <Badge label="HIGH ENGAGEMENT" variant="brand" />
            </View>
            <Text style={styles.optionDesc}>
              {t(
                'create.postReelDesc',
                'Record or upload a 60s product showcase video. Video listings get 4x more buyer inquiries.'
              )}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Option 2: Regular Classified Listing */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/listing/create', params: { type: 'regular' } })}
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
              {t('create.postListingDesc', 'Add photos, price, description and location for classified buyers.')}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Helpful Selling Tips Card */}
      <Card variant="subtle" style={styles.tipsCard}>
        <Text style={styles.tipsHeading}>💡 Pro Tips for Fast Selling</Text>
        <Text style={styles.tipsItem}>• Take clear photos in natural light from multiple angles.</Text>
        <Text style={styles.tipsItem}>• Set a competitive market price to attract genuine buyers.</Text>
        <Text style={styles.tipsItem}>• Respond quickly to chat inquiries to close deals faster.</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.titleMedium,
    color: '#002f34',
    fontWeight: '800',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  iconCircleBrand: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#002f34',
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
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate900,
  },
  optionDesc: {
    ...typography.bodySmall,
    color: palette.slate500,
    marginTop: 2,
    lineHeight: 18,
  },
  tipsCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  tipsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: spacing.xs,
  },
  tipsItem: {
    fontSize: 12,
    color: palette.slate600,
    lineHeight: 20,
  },
});
