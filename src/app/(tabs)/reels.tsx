import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Badge } from '../../components/ui/Badge';
import { palette, radii, spacing, typography } from '../../constants/tokens';

export default function ReelsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenContainer
      scrollable={false}
      backgroundColor={palette.slate950}
      contentContainerStyle={styles.container}
    >
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>{t('reels.title', 'Video Feed')}</Text>
        <Badge label="Phase 0 Preview" variant="warning" />
      </View>

      {/* Main Video Area Placeholder */}
      <View style={styles.videoCard}>
        <View style={styles.placeholderPlayArea}>
          <View style={styles.playIconCircle}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          <Text style={styles.videoNoticeTitle}>Vertical Video Player Feed</Text>
          <Text style={styles.videoNoticeSubtext}>
            Full-screen video streaming with expo-video will be integrated with object storage & transcoding pipeline in Phase 1.
          </Text>
        </View>

        {/* Overlay Overlay Info */}
        <View style={styles.overlayInfo}>
          <View style={styles.sellerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <View>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.sellerName}>Mandi Certified Store</Text>
                <Badge label="Verified" variant="success" />
              </View>
              <Text style={styles.productTitle}>Royal Enfield Classic 350 (2022)</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceTag}>₹1,65,000</Text>
            <Text style={styles.locationText}>📍 Mumbai, Maharashtra</Text>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => router.push('/chat/new-inquiry')}
            >
              <Text style={styles.actionBtnPrimaryText}>
                💬 {t('reels.chatWithSeller', 'Chat with Seller')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => router.push('/listing/sample-1')}
            >
              <Text style={styles.actionBtnSecondaryText}>
                ℹ {t('reels.viewListing', 'View Details')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    backgroundColor: palette.slate950,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.titleMedium,
    color: palette.pureWhite,
  },
  videoCard: {
    flex: 1,
    backgroundColor: palette.slate900,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radii.xl,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  placeholderPlayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  playIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.brand500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  playIcon: {
    fontSize: 26,
    color: palette.pureWhite,
    marginLeft: 4,
  },
  videoNoticeTitle: {
    ...typography.titleSmall,
    color: palette.pureWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  videoNoticeSubtext: {
    ...typography.bodySmall,
    color: palette.slate400,
    textAlign: 'center',
    lineHeight: 18,
  },
  overlayInfo: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.brand500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: palette.pureWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sellerName: {
    ...typography.bodySmall,
    color: palette.pureWhite,
    fontWeight: '600',
  },
  productTitle: {
    ...typography.caption,
    color: palette.slate300,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  priceTag: {
    ...typography.titleMedium,
    color: palette.brand400,
  },
  locationText: {
    ...typography.caption,
    color: palette.slate400,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: palette.brand500,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: palette.pureWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnSecondary: {
    backgroundColor: palette.slate800,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    color: palette.slate200,
    fontWeight: '600',
    fontSize: 13,
  },
});
