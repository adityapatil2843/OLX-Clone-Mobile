import React, { useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { palette } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { useMyListingsQuery } from '../../hooks/useListings';
import { useReelsQuery } from '../../hooks/useReels';
import { useWishlistQuery, useToggleWishlistMutation } from '../../hooks/useWishlist';
import { Listing } from '../../services/listings.service';

// Modular Account Components
import { AccountHeader } from '../../components/account/AccountHeader';
import { AccountStats } from '../../components/account/AccountStats';
import {
  AccountContentTabs,
  AccountTabKey,
} from '../../components/account/AccountContentTabs';
import { AccountListingsTab } from '../../components/account/AccountListingsTab';
import { AccountReelsTab } from '../../components/account/AccountReelsTab';
import { AccountWishlistTab } from '../../components/account/AccountWishlistTab';
import { AccountSideDrawer } from '../../components/account/AccountSideDrawer';
import { BoostModal, BoostModalTarget } from '../../components/boost/BoostModal';

export default function AccountScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AccountTabKey>('listings');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [boostTarget, setBoostTarget] = useState<BoostModalTarget | null>(null);

  // Queries
  const {
    data: myListingsData,
    isLoading: isListingsLoading,
    error: listingsError,
    isRefetching: isListingsRefetching,
    refetch: refetchListings,
  } = useMyListingsQuery();

  const {
    data: myReelsData,
    isLoading: isReelsLoading,
    error: reelsError,
    isRefetching: isReelsRefetching,
    refetch: refetchReels,
  } = useReelsQuery(user?.id ? { creatorId: user.id } : undefined);

  const {
    data: wishlistData,
    isLoading: isWishlistLoading,
    error: wishlistError,
    isRefetching: isWishlistRefetching,
    refetch: refetchWishlist,
  } = useWishlistQuery();

  const toggleWishlistMutation = useToggleWishlistMutation();

  const listings = myListingsData?.data || [];
  const reels = myReelsData?.data || [];
  const wishlistItems = wishlistData?.data || [];

  const isRefreshing =
    isListingsRefetching || isReelsRefetching || isWishlistRefetching;

  const handleRefreshAll = useCallback(() => {
    refetchListings();
    if (user?.id) refetchReels();
    refetchWishlist();
  }, [refetchListings, refetchReels, refetchWishlist, user?.id]);

  const handleEditProfile = () => {
    if (user?.id) {
      router.push(`/profile/${user.id}?edit=true`);
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleOpenBoostForListing = (listing: Listing) => {
    setBoostTarget({
      type: 'LISTING',
      id: listing.id,
      title: listing.title,
    });
  };

  const handleRemoveWishlistItem = (listingId: string) => {
    toggleWishlistMutation.mutate({
      listingId,
      isWishlisted: true,
    });
  };

  return (
    <ScreenContainer
      scrollable
      hasBottomTab
      backgroundColor={palette.slate50}
      contentContainerStyle={styles.container}
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefreshAll}
            colors={['#002f34']}
          />
        ),
      }}
    >
      {/* ── Profile Top Section ── */}
      <AccountHeader
        user={user}
        isAuthenticated={isAuthenticated}
        onEditProfile={handleEditProfile}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onLoginPress={() => router.push('/(auth)/login')}
      />

      {/* ── Stats Row (Listings & Reels counts; Followers/Following modularly hidden) ── */}
      {isAuthenticated && (
        <AccountStats
          listingsCount={listings.length}
          reelsCount={reels.length}
          onListingsPress={() => setActiveTab('listings')}
          onReelsPress={() => setActiveTab('reels')}
        />
      )}

      {/* ── Content Tabs Bar (Listings | Reels | Saved) ── */}
      <AccountContentTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        listingsCount={isAuthenticated ? listings.length : undefined}
        reelsCount={isAuthenticated ? reels.length : undefined}
        savedCount={isAuthenticated ? wishlistItems.length : undefined}
      />

      {/* ── Tab Views ── */}
      <View style={styles.tabContentContainer}>
        {activeTab === 'listings' && (
          <AccountListingsTab
            listings={listings}
            isLoading={isListingsLoading}
            error={listingsError}
            onRefresh={refetchListings}
            onBoostListing={handleOpenBoostForListing}
          />
        )}

        {activeTab === 'reels' && (
          <AccountReelsTab
            reels={reels}
            isLoading={isReelsLoading}
            error={reelsError}
            onRefresh={refetchReels}
          />
        )}

        {activeTab === 'saved' && (
          <AccountWishlistTab
            items={wishlistItems}
            isLoading={isWishlistLoading}
            error={wishlistError}
            onRefresh={refetchWishlist}
            onRemoveItem={handleRemoveWishlistItem}
          />
        )}
      </View>

      {/* ── Account Side Navigation Drawer ── */}
      <AccountSideDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsDrawerOpen(false);
        }}
      />

      {/* ── Boost Flow Modal ── */}
      <BoostModal
        visible={Boolean(boostTarget)}
        target={boostTarget}
        onClose={() => setBoostTarget(null)}
        onSuccess={() => {
          refetchListings();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  tabContentContainer: {
    flex: 1,
  },
});
