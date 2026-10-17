import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useAppStore } from '../../stores/useAppStore';

const CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { id: 'properties', label: 'Properties', icon: '🏠' },
  { id: 'mobiles', label: 'Mobiles', icon: '📱' },
  { id: 'jobs', label: 'Jobs', icon: '💼' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'services', label: 'Services', icon: '🛠️' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedCity } = useAppStore();

  return (
    <ScreenContainer scrollable>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>{t('common.appName', 'Mandi Live')}</Text>
          <Badge label="Phase 0 Foundation" variant="brand" />
        </View>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>{selectedCity}</Text>
          <Text style={styles.locationArrow}>⌄</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar CTA */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => router.push('/search')}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>
          {t('common.searchPlaceholder', 'Search cars, mobiles, jobs, electronics...')}
        </Text>
      </TouchableOpacity>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.categories', 'Top Categories')}</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => router.push('/search')}
            >
              <View style={styles.categoryIconCircle}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Video Reels Banner */}
      <Card variant="elevated" style={styles.reelsBannerCard}>
        <View style={styles.reelsHeader}>
          <View>
            <Badge label="Video First" variant="brand" style={{ marginBottom: 4 }} />
            <Text style={styles.reelsTitle}>{t('home.featuredReels', 'Trending Video Reels')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/reels')}>
            <Text style={styles.viewAllText}>{t('common.viewAll', 'View All')} →</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.reelsSubtext}>
          Discover products via 60-second video showcases. Sellers demonstrate real conditions before you chat.
        </Text>
        <TouchableOpacity
          style={styles.watchFeedButton}
          onPress={() => router.push('/(tabs)/reels')}
        >
          <Text style={styles.watchFeedButtonText}>▶ Open Video Feed</Text>
        </TouchableOpacity>
      </Card>

      {/* Recommended Listings Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('home.freshRecommendations', 'Fresh Recommendations')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.viewAllText}>{t('common.viewAll', 'View All')}</Text>
          </TouchableOpacity>
        </View>

        <Card variant="subtle" style={styles.emptyNoticeCard}>
          <Text style={styles.noticeHeading}>Backend Integration in Phase 1</Text>
          <Text style={styles.noticeBody}>
            Live marketplace listings, search indexing and real-time feeds will connect to the PostgreSQL + search backend in Phase 1.
          </Text>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  brandTitle: {
    ...typography.titleLarge,
    color: palette.brand500,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  locationPin: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    ...typography.bodySmall,
    color: palette.slate700,
    fontWeight: '600',
  },
  locationArrow: {
    fontSize: 14,
    color: palette.slate500,
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    ...typography.bodyMedium,
    color: palette.slate400,
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: palette.slate900,
    marginBottom: spacing.sm,
  },
  viewAllText: {
    ...typography.caption,
    color: palette.brand500,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate100,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryLabel: {
    ...typography.caption,
    color: palette.slate700,
    fontWeight: '600',
  },
  reelsBannerCard: {
    backgroundColor: palette.slate900,
    marginBottom: spacing.xl,
  },
  reelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reelsTitle: {
    ...typography.titleSmall,
    color: palette.pureWhite,
  },
  reelsSubtext: {
    ...typography.bodySmall,
    color: palette.slate300,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  watchFeedButton: {
    backgroundColor: palette.brand500,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  watchFeedButtonText: {
    color: palette.pureWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyNoticeCard: {
    backgroundColor: palette.slate100,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  noticeHeading: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: spacing.xs,
  },
  noticeBody: {
    ...typography.bodySmall,
    color: palette.slate600,
    lineHeight: 18,
  },
});
