import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { AppHeader } from '../components/ui/AppHeader';
import { Badge } from '../components/ui/Badge';
import { palette, radii, spacing } from '../constants/tokens';
import {
  useMyAdvertisementsQuery,
  useCancelBoostMutation,
} from '../hooks/useBoost';
import { Advertisement } from '../services/boost.service';
import { formatRelativeTime } from '../utils/formatters';
import { Zap, ArrowLeft, Clapperboard, Package } from 'lucide-react-native';

export default function BoostedContentScreen() {
  const router = useRouter();

  const {
    data: adsData,
    isLoading,
    isRefetching,
    refetch,
  } = useMyAdvertisementsQuery(1, 30);

  const cancelBoostMutation = useCancelBoostMutation();

  const advertisements = adsData?.data || [];

  const handleCancelBoost = (ad: Advertisement) => {
    Alert.alert(
      'Cancel Boost',
      `Are you sure you want to stop boosting "${ad.title || 'this item'}"? The boost will be deactivated.`,
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Stop Boost',
          style: 'destructive',
          onPress: () => {
            cancelBoostMutation.mutate(ad.id, {
              onSuccess: () => {
                Alert.alert('Boost Stopped', 'The campaign has been cancelled.');
                refetch();
              },
              onError: (err: any) => {
                Alert.alert('Error', err?.message || 'Could not cancel boost.');
              },
            });
          },
        },
      ]
    );
  };

  const renderAdItem = ({ item }: { item: Advertisement }) => {
    const isListing = item.targetType === 'LISTING';
    const isActive = item.status === 'ACTIVE';

    return (
      <View style={styles.adCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadgeRow}>
            {isListing ? (
              <Package size={15} color="#002f34" style={{ marginRight: 4 }} />
            ) : (
              <Clapperboard size={15} color="#002f34" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.typeText}>{item.targetType}</Text>
          </View>
          <Badge
            label={item.status}
            variant={isActive ? 'success' : 'default'}
          />
        </View>

        <Text style={styles.adTitle} numberOfLines={2}>
          {item.listing?.title || item.reel?.title || item.title || 'Boost Campaign'}
        </Text>

        <View style={styles.metaRow}>
          {item.packageDays && (
            <Text style={styles.metaItem}>Duration: {item.packageDays} Days</Text>
          )}
          {item.coinsSpent && (
            <Text style={styles.metaItem}>Coins: {item.coinsSpent}</Text>
          )}
        </View>

        {item.endDate && (
          <Text style={styles.dateText}>
            {isActive
              ? `Ends ${formatRelativeTime(item.endDate)}`
              : `Ended on ${new Date(item.endDate).toLocaleDateString()}`}
          </Text>
        )}

        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.viewTargetBtn}
            onPress={() => {
              if (isListing && item.targetId) {
                router.push(`/listing/${item.targetId}`);
              } else if (!isListing && item.targetId) {
                router.push(`/reel/${item.targetId}`);
              }
            }}
          >
            <Text style={styles.viewTargetBtnText}>View {isListing ? 'Listing' : 'Reel'}</Text>
          </TouchableOpacity>

          {isActive && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelBoost(item)}
              disabled={cancelBoostMutation.isPending}
            >
              <Text style={styles.cancelBtnText}>Stop Boost</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader
        title="Boosted Content"
        onBack={() => router.back()}
        left={<ArrowLeft size={24} color="#002f34" />}
      />

      <FlatList
        data={advertisements}
        keyExtractor={(item) => item.id}
        renderItem={renderAdItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#002f34']}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#002f34" />
              <Text style={styles.emptyText}>Loading boosted campaigns...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Zap size={44} color={palette.slate300} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No boosted content yet</Text>
              <Text style={styles.emptyText}>
                Boost your listings and reels from the Account tab or item detail page to get 10x more visibility.
              </Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  adCard: {
    backgroundColor: palette.pureWhite,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002f34',
  },
  adTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate900,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  metaItem: {
    fontSize: 12,
    color: palette.slate600,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  viewTargetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: palette.slate100,
  },
  viewTargetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002f34',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.danger500,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.danger600,
  },
  centerLoading: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
    lineHeight: 18,
  },
});
