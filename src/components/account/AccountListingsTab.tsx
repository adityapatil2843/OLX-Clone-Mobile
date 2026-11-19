import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';
import { useRouter } from 'expo-router';
import { Listing } from '../../services/listings.service';
import { palette, radii, spacing } from '../../constants/tokens';
import { formatCurrencyINR, formatRelativeTime } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Camera, Plus, Zap, AlertCircle, RefreshCw, Eye, Pencil } from 'lucide-react-native';

export interface AccountListingsTabProps {
  listings: Listing[];
  isLoading: boolean;
  error?: unknown;
  onRefresh?: () => void;
  onBoostListing?: (listing: Listing) => void;
}

export const AccountListingsTab: React.FC<AccountListingsTabProps> = ({
  listings,
  isLoading,
  error,
  onRefresh,
  onBoostListing,
}) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#002f34" />
        <Text style={styles.stateText}>Loading your listings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={36} color={palette.danger500} style={{ marginBottom: 8 }} />
        <Text style={styles.stateTitle}>Could not load listings</Text>
        <Text style={styles.stateText}>Please check your connection and try again.</Text>
        {onRefresh && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <RefreshCw size={14} color={palette.pureWhite} style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (listings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Camera size={44} color={palette.slate300} style={{ marginBottom: 8 }} />
        <Text style={styles.stateTitle}>No listings yet</Text>
        <Text style={styles.stateText}>
          {"You haven't listed any products for sale. Post an ad to reach buyers nearby!"}
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Plus size={16} color={palette.pureWhite} style={{ marginRight: 6 }} />
          <Text style={styles.ctaButtonText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {listings.map((item) => {
        const primaryImg = item.media?.[0]?.url || item.media?.[0]?.thumbnailKey;
        const hasReel = item.reels && item.reels.length > 0;

        return (
          <View key={item.id} style={styles.listingCard}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => router.push(`/listing/${item.id}`)}
              activeOpacity={0.8}
            >
              {primaryImg ? (
                <ExpoImage
                  source={{ uri: optimizeCloudinaryUrl(primaryImg) }}
                  style={styles.cardThumbnail}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={styles.cardNoThumbnail}>
                  <Camera size={22} color={palette.slate400} />
                </View>
              )}

              <View style={styles.cardDetails}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardPrice}>{formatCurrencyINR(item.price)}</Text>
                <View style={styles.badgeRow}>
                  <Badge
                    label={item.status}
                    variant={item.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                  {hasReel && (
                    <Badge label="📹 REEL LIVE" variant="brand" style={{ marginLeft: 6 }} />
                  )}
                </View>
                <Text style={styles.cardDate}>
                  Posted {formatRelativeTime(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Quick Actions Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={() => router.push(`/listing/${item.id}`)}
              >
                <Eye size={14} color="#002f34" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnOutlineText}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={() => router.push(`/listing/edit/${item.id}`)}
              >
                <Pencil size={14} color="#002f34" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnOutlineText}>Edit</Text>
              </TouchableOpacity>

              {onBoostListing && item.status === 'ACTIVE' && (
                <TouchableOpacity
                  style={styles.actionBtnBoost}
                  onPress={() => onBoostListing(item)}
                >
                  <Zap size={14} color="#002f34" style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnBoostText}>Boost</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  listingCard: {
    backgroundColor: palette.pureWhite,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardThumbnail: {
    width: 68,
    height: 68,
    borderRadius: radii.md,
    marginRight: spacing.md,
  },
  cardNoThumbnail: {
    width: 68,
    height: 68,
    borderRadius: radii.md,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.slate300,
    backgroundColor: palette.pureWhite,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002f34',
  },
  actionBtnBoost: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radii.md,
    backgroundColor: '#ffce32',
  },
  actionBtnBoostText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002f34',
  },
  centerContainer: {
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: 4,
  },
  stateText: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002f34',
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    marginTop: spacing.md,
  },
  ctaButtonText: {
    color: palette.pureWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002f34',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    marginTop: spacing.md,
  },
  retryBtnText: {
    color: palette.pureWhite,
    fontSize: 12,
    fontWeight: '700',
  },
});
