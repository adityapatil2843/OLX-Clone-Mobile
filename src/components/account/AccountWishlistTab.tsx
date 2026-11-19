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
import { WishlistItem } from '../../services/wishlist.service';
import { palette, radii, spacing } from '../../constants/tokens';
import { formatCurrencyINR } from '../../utils/formatters';
import { Heart, Search, Camera, AlertCircle, RefreshCw } from 'lucide-react-native';

export interface AccountWishlistTabProps {
  items: WishlistItem[];
  isLoading: boolean;
  error?: unknown;
  onRefresh?: () => void;
  onRemoveItem?: (listingId: string) => void;
}

export const AccountWishlistTab: React.FC<AccountWishlistTabProps> = ({
  items,
  isLoading,
  error,
  onRefresh,
  onRemoveItem,
}) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#002f34" />
        <Text style={styles.stateText}>Loading your wishlist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={36} color={palette.danger500} style={{ marginBottom: 8 }} />
        <Text style={styles.stateTitle}>Could not load wishlist</Text>
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

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Heart size={44} color={palette.slate300} style={{ marginBottom: 8 }} />
        <Text style={styles.stateTitle}>Your wishlist is empty</Text>
        <Text style={styles.stateText}>
          {"Save listings you're interested in by tapping the heart icon on any product."}
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/(tabs)/listings')}
        >
          <Search size={16} color={palette.pureWhite} style={{ marginRight: 6 }} />
          <Text style={styles.ctaButtonText}>Explore Marketplace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {items.map((wishlistItem) => {
        const listing = wishlistItem.listing;
        if (!listing) return null;

        const primaryImg = listing.media?.[0]?.url || listing.media?.[0]?.thumbnailKey;

        return (
          <TouchableOpacity
            key={wishlistItem.id}
            style={styles.wishlistCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/listing/${listing.id}`)}
          >
            {primaryImg ? (
              <ExpoImage
                source={{ uri: optimizeCloudinaryUrl(primaryImg) }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.noThumbnail}>
                <Camera size={22} color={palette.slate400} />
              </View>
            )}

            <View style={styles.details}>
              <Text style={styles.title} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.price}>{formatCurrencyINR(listing.price)}</Text>
              <Text style={styles.location} numberOfLines={1}>
                {[listing.locationCity, listing.locationState].filter(Boolean).join(', ') || 'India'}
              </Text>
            </View>

            {onRemoveItem && (
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => onRemoveItem(listing.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart size={20} color="#ff3040" fill="#ff3040" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  wishlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    marginRight: spacing.md,
  },
  noThumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
    marginTop: 2,
  },
  location: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
  },
  heartBtn: {
    padding: spacing.sm,
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
