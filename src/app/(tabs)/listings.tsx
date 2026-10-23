import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useCategoriesQuery } from '../../hooks/useCategories';
import { useListingsQuery } from '../../hooks/useListings';
import { useToggleWishlistMutation } from '../../hooks/useWishlist';
import { Listing } from '../../services/listings.service';
import { useAppStore } from '../../stores/useAppStore';
import { formatCurrencyINR, formatRelativeTime } from '../../utils/formatters';

export default function ListingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedCity } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories, isLoading: isCategoriesLoading } = useCategoriesQuery('flat');
  const {
    data: listingsData,
    isLoading: isListingsLoading,
    isRefetching,
    refetch,
  } = useListingsQuery({
    categoryId: selectedCategory || undefined,
    city: selectedCity && selectedCity !== 'All India' ? selectedCity : undefined,
  });

  const toggleWishlist = useToggleWishlistMutation();

  const listings = listingsData?.data || [];

  const handleToggleWishlist = (listing: Listing) => {
    toggleWishlist.mutate({
      listingId: listing.id,
      isWishlisted: Boolean(listing.isWishlisted),
    });
  };

  const renderCategoryItem = ({ item }: { item: { id: string; name: string; icon?: string | null } }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(isSelected ? null : item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryChipEmoji}>{item.icon || '🏷️'}</Text>
        <Text
          style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderListingCard = ({ item }: { item: Listing }) => {
    const primaryMedia = item.media?.[0];
    const imageUrl = primaryMedia?.url || primaryMedia?.thumbnailKey;

    return (
      <TouchableOpacity
        style={styles.listingCard}
        activeOpacity={0.88}
        onPress={() => router.push(`/listing/${item.id}`)}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.listingImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.noImageIcon}>📷</Text>
              <Text style={styles.noImageText}>No photo</Text>
            </View>
          )}

          {/* Wishlist Heart Button */}
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={() => handleToggleWishlist(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.wishlistHeart}>
              {item.isWishlisted ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          {item.owner?.isVerifiedSeller && (
            <View style={styles.verifiedBadgeContainer}>
              <Badge label="VERIFIED" variant="brand" />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.priceText}>{formatCurrencyINR(item.price)}</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.locationDateRow}>
            <Text style={styles.cardLocationText} numberOfLines={1}>
              📍 {[item.locationLocality, item.locationCity].filter(Boolean).join(', ') || 'India'}
            </Text>
            <Text style={styles.dateText}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false} hasBottomTab>
      {/* Top Location & Notification Bar (OLX Header Style) */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Mandi</Text>
          <Text style={styles.brandSubtitle}>INDIA</Text>
        </View>

        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedCity || 'All India'}
          </Text>
          <Text style={styles.locationArrow}>⌄</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.push('/(tabs)/account')}
        >
          <Text style={styles.headerIconEmoji}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar CTA */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.85}
        onPress={() => router.push('/search')}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>
          {t('common.searchPlaceholder', 'Find Cars, Mobile Phones and more...')}
        </Text>
        <Text style={styles.micIcon}>🎙️</Text>
      </TouchableOpacity>

      {/* Categories Horizontal Carousel */}
      <View style={styles.categoriesSection}>
        {isCategoriesLoading ? (
          <ActivityIndicator size="small" color={palette.brand500} style={{ padding: spacing.sm }} />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories || []}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryItem}
            contentContainerStyle={styles.categoriesList}
          />
        )}
      </View>

      {/* Recommended Listings Grid */}
      <View style={styles.listingsHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? 'Filtered Listings' : 'Fresh Recommendations'}
        </Text>
        {selectedCategory && (
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.clearFilterText}>Clear filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {isListingsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.brand500} />
          <Text style={styles.loadingText}>Loading marketplace...</Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No listings found</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to post an ad in this category or location!
          </Text>
          <TouchableOpacity
            style={styles.postAdButton}
            onPress={() => router.push('/(tabs)/create')}
          >
            <Text style={styles.postAdButtonText}>+ Post an Ad</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderListingCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[palette.brand500]}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#002f34',
    letterSpacing: -1,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: palette.brand600,
    marginLeft: 2,
  },
  locationSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  locationPin: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    ...typography.caption,
    color: palette.slate800,
    fontWeight: '600',
    flex: 1,
  },
  locationArrow: {
    fontSize: 12,
    color: palette.slate500,
    marginLeft: 2,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.pureWhite,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  headerIconEmoji: {
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    ...typography.bodySmall,
    color: palette.slate400,
    flex: 1,
  },
  micIcon: {
    fontSize: 15,
    marginLeft: spacing.xs,
  },
  categoriesSection: {
    marginBottom: spacing.sm,
  },
  categoriesList: {
    paddingVertical: 4,
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: spacing.xs,
  },
  categoryChipSelected: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  categoryChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: palette.slate700,
  },
  categoryChipTextSelected: {
    color: palette.pureWhite,
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.headline,
    color: palette.slate900,
    fontWeight: '700',
  },
  clearFilterText: {
    ...typography.caption,
    color: palette.brand500,
    fontWeight: '600',
  },
  gridContainer: {
    paddingBottom: spacing.xl,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  listingCard: {
    width: '48.5%',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: palette.slate100,
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageIcon: {
    fontSize: 28,
    color: palette.slate300,
  },
  noImageText: {
    ...typography.caption,
    color: palette.slate400,
    marginTop: 2,
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistHeart: {
    fontSize: 14,
  },
  verifiedBadgeContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  cardContent: {
    padding: spacing.sm,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 2,
  },
  titleText: {
    ...typography.bodySmall,
    color: palette.slate800,
    fontWeight: '500',
    height: 36,
  },
  locationDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: palette.slate100,
  },
  cardLocationText: {
    fontSize: 10,
    color: palette.slate500,
    flex: 1,
  },
  dateText: {
    fontSize: 10,
    color: palette.slate400,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    ...typography.bodySmall,
    color: palette.slate500,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: palette.slate500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  postAdButton: {
    backgroundColor: '#002f34',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  postAdButtonText: {
    color: palette.pureWhite,
    fontWeight: '700',
    fontSize: 14,
  },
});
