import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useCategoriesQuery } from '../../hooks/useCategories';
import { useListingsQuery } from '../../hooks/useListings';
import { Listing } from '../../services/listings.service';
import { formatCurrencyINR, formatRelativeTime } from '../../utils/formatters';

const POPULAR_SEARCHES = ['Honda City', 'iPhone', 'Royal Enfield', 'Apartment', 'Laptop', 'Sofa'];

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Debounce search query 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: categories } = useCategoriesQuery('flat');
  const { data: listingsData, isLoading } = useListingsQuery({
    search: debouncedQuery || undefined,
    categoryId: selectedCategory || undefined,
  });

  const listings = listingsData?.data || [];

  const renderListingCard = ({ item }: { item: Listing }) => {
    const primaryMedia = item.media?.[0];
    const imageUrl = primaryMedia?.url || primaryMedia?.thumbnailKey;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push(`/listing/${item.id}`)}
      >
        <View style={styles.cardImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImage}>
              <Text>📷</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.cardPrice}>{formatCurrencyINR(item.price)}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardLocation} numberOfLines={1}>
              📍 {[item.locationCity, item.locationState].filter(Boolean).join(', ') || 'India'}
            </Text>
            <Text style={styles.cardDate}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader title="Search Marketplace" onBack={() => router.back()} />

      <View style={styles.searchBarWrapper}>
        <AppInput
          placeholder={t('common.searchPlaceholder', 'Search cars, mobiles, jobs, electronics...')}
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
          leftAccessory={<Text style={styles.searchIcon}>🔍</Text>}
        />
      </View>

      {/* Categories Filter Strip */}
      {categories && categories.length > 0 && (
        <View style={styles.categoriesRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(cat) => cat.id}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                  onPress={() => setSelectedCategory(isSelected ? null : item.id)}
                >
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Popular Suggestions if query is empty */}
      {!query && !selectedCategory && (
        <View style={styles.popularSection}>
          <Text style={styles.popularTitle}>Popular Searches</Text>
          <View style={styles.popularTags}>
            {POPULAR_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.popularTag}
                onPress={() => setQuery(item)}
              >
                <Text style={styles.popularTagText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#002f34" />
          <Text style={styles.loadingText}>Searching listings...</Text>
        </View>
      ) : (query || selectedCategory) && listings.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No matching listings found</Text>
          <Text style={styles.emptySubtitle}>Try searching with different keywords or clear filters.</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderListingCard}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchBarWrapper: {
    paddingTop: spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  categoriesRow: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: palette.pureWhite,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: spacing.xs,
  },
  categoryPillSelected: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate700,
  },
  categoryPillTextSelected: {
    color: palette.pureWhite,
  },
  popularSection: {
    marginVertical: spacing.md,
  },
  popularTitle: {
    ...typography.headline,
    color: palette.slate800,
    marginBottom: spacing.sm,
  },
  popularTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  popularTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: palette.pureWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  popularTagText: {
    ...typography.caption,
    color: palette.slate700,
  },
  gridContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  card: {
    width: '48.5%',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: palette.slate100,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    padding: spacing.sm,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.slate800,
    marginTop: 2,
    height: 32,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: palette.slate100,
    paddingTop: 4,
  },
  cardLocation: {
    fontSize: 10,
    color: palette.slate500,
    flex: 1,
  },
  cardDate: {
    fontSize: 10,
    color: palette.slate400,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: palette.slate500,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: palette.slate500,
    textAlign: 'center',
  },
});
