import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing } from '../../constants/tokens';
import { Badge } from '../../components/ui/Badge';
import { useListingDetailQuery } from '../../hooks/useListings';
import { useToggleWishlistMutation } from '../../hooks/useWishlist';
import { useCreateConversationMutation } from '../../hooks/useChat';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatCurrencyINR, formatRelativeTime } from '../../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: listing, isLoading, error } = useListingDetailQuery(id || '');
  const toggleWishlist = useToggleWishlistMutation();
  const createConversation = useCreateConversationMutation();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#002f34" />
        <Text style={styles.loadingText}>Loading listing details...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Listing not found</Text>
        <Text style={styles.errorSubtitle}>This ad may have been removed or sold by the owner.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mediaList = listing.media || [];
  const isOwner = user?.id === listing.ownerId;

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    toggleWishlist.mutate({
      listingId: listing.id,
      isWishlisted: Boolean(listing.isWishlisted),
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${listing.title}" for ${formatCurrencyINR(listing.price)} on Mandi Live!`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (isOwner) {
      alert('You are the seller of this listing.');
      return;
    }

    createConversation.mutate(
      { recipientId: listing.ownerId, listingId: listing.id },
      {
        onSuccess: (conversation) => {
          router.push(`/chat/${conversation.id}`);
        },
        onError: (err: any) => {
          alert(err.message || 'Could not start chat with seller');
        },
      }
    );
  };

  const handleCall = () => {
    if (listing.contactPhone) {
      Linking.openURL(`tel:${listing.contactPhone}`);
    } else {
      alert('Seller phone number is not available.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 90 + Math.max(insets.bottom, 12) },
        ]}
      >
        {/* Image Gallery / Hero Carousel */}
        <View style={styles.galleryContainer}>
          {mediaList.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
            >
              {mediaList.map((media, idx) => {
                const imgUri = media.url || media.thumbnailKey;
                return (
                  <Image
                    key={media.id || idx}
                    source={{ uri: imgUri || 'https://via.placeholder.com/600x400' }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageIcon}>📷</Text>
              <Text style={styles.noImageText}>No photos provided for this listing</Text>
            </View>
          )}

          {/* Floating Top Nav (Back & Share) */}
          <View style={[styles.floatingTopNav, { top: Math.max(insets.top, 10) }]}>
            <TouchableOpacity style={styles.circularIconBtn} onPress={() => router.back()}>
              <Text style={styles.navIconText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.circularIconBtn} onPress={handleShare}>
              <Text style={styles.navIconText}>↗</Text>
            </TouchableOpacity>
          </View>

          {/* Image Counter Badge */}
          {mediaList.length > 0 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {activeImageIndex + 1}/{mediaList.length}
              </Text>
            </View>
          )}
        </View>

        {/* Views Notice Strip */}
        <View style={styles.viewsBanner}>
          <Text style={styles.viewsBannerText}>
            👁️ Verified listing • Direct seller contact available
          </Text>
        </View>

        {/* Listing Title, Price & Badges Card */}
        <View style={styles.detailsCard}>
          {isOwner && (
            <View style={styles.ownerNoticeBanner}>
              <View style={styles.ownerNoticeLeft}>
                <Text style={styles.ownerCrownIcon}>👑</Text>
                <View>
                  <Text style={styles.ownerNoticeTitle}>You own this listing</Text>
                  <Text style={styles.ownerNoticeDesc}>Manage photos, video reel, and price</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.ownerHeaderEditBtn}
                onPress={() => router.push(`/listing/edit/${listing.id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.ownerHeaderEditBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.badgeRow}>
            {listing.owner?.isVerifiedSeller && (
              <Badge label="👑 ELITE SELLER" variant="brand" style={{ marginRight: 6 }} />
            )}
            <Badge label={listing.status} variant={listing.status === 'ACTIVE' ? 'success' : 'default'} />
            <TouchableOpacity style={styles.wishlistHeartBtn} onPress={handleToggleWishlist}>
              <Text style={styles.wishlistHeartText}>
                {listing.isWishlisted ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatCurrencyINR(listing.price)}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.location}>
              📍 {[listing.locationLocality, listing.locationCity, listing.locationState].filter(Boolean).join(', ')}
            </Text>
            <Text style={styles.date}>Posted {formatRelativeTime(listing.createdAt)}</Text>
          </View>
        </View>

        {/* Product Video Reel Showcase if attached */}
        {listing.reels && listing.reels.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.videoSectionHeader}>
              <Text style={styles.sectionHeading}>📹 Video Showcase</Text>
              <Badge label="REEL LIVE" variant="brand" />
            </View>
            <TouchableOpacity
              style={styles.reelWatchBanner}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.85}
            >
              <View style={styles.reelPlayCircle}>
                <Text style={styles.reelPlayIcon}>▶</Text>
              </View>
              <View style={styles.reelWatchInfo}>
                <Text style={styles.reelWatchTitle}>Watch Product Video Reel</Text>
                <Text style={styles.reelWatchSubtitle}>Tap to watch 60s live video showcase on Mandi Reels</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : isOwner ? (
          /* Owner Callout to Add Reel Later */
          <View style={styles.sectionCard}>
            <View style={styles.videoSectionHeader}>
              <Text style={styles.sectionHeading}>📹 Video Reel</Text>
              <Badge label="BOOST INQUIRIES" variant="brand" />
            </View>
            <TouchableOpacity
              style={styles.ownerAddReelBanner}
              onPress={() => router.push(`/listing/edit/${listing.id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.ownerAddReelIcon}>🎬</Text>
              <View style={styles.ownerAddReelInfo}>
                <Text style={styles.ownerAddReelTitle}>+ Add a 60s Video Reel</Text>
                <Text style={styles.ownerAddReelDesc}>
                  Upload in MP4, MOV, or WebM format. Video listings appear on the Mandi Reels screen and get 4x more buyers!
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Description Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.descriptionText}>
            {listing.description || 'No description provided by the seller.'}
          </Text>
        </View>

        {/* Category & Attributes Section */}
        {listing.attributes && Object.keys(listing.attributes).length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Specifications</Text>
            <View style={styles.attributesGrid}>
              {Object.entries(listing.attributes).map(([key, val]) => (
                <View key={key} style={styles.attributeItem}>
                  <Text style={styles.attributeKey}>{key.toUpperCase()}</Text>
                  <Text style={styles.attributeVal}>{String(val)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Seller Info Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Seller Details</Text>
          <TouchableOpacity
            style={styles.sellerRow}
            onPress={() => router.push(`/profile/${listing.ownerId}`)}
            activeOpacity={0.7}
          >
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {listing.owner?.name ? listing.owner.name[0].toUpperCase() : '👤'}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.owner?.name || 'Seller'}</Text>
                {listing.owner?.isVerifiedSeller && (
                  <Text style={styles.verifiedCheck}>✓</Text>
                )}
              </View>
              <Text style={styles.viewProfileText}>View Profile ›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        {isOwner ? (
          <>
            <TouchableOpacity
              style={styles.ownerPrimaryEditBtn}
              onPress={() => router.push(`/listing/edit/${listing.id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.ownerPrimaryEditBtnText}>✏️ Edit Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ownerSecondaryMediaBtn}
              onPress={() => router.push(`/listing/edit/${listing.id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.ownerSecondaryMediaBtnText}>
                {listing.reels && listing.reels.length > 0 ? '📸 Add Photos' : '📹 + Add Reel'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.chatButton, createConversation.isPending && styles.disabledBtn]}
              onPress={handleChat}
              disabled={createConversation.isPending}
              activeOpacity={0.85}
            >
              {createConversation.isPending ? (
                <ActivityIndicator size="small" color="#002f34" />
              ) : (
                <Text style={styles.chatButtonText}>💬 Chat</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              activeOpacity={0.85}
            >
              <Text style={styles.callButtonText}>📞 Call</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  scrollContent: {
    flexGrow: 1,
  },
  galleryContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#000',
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  noImageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageIcon: {
    fontSize: 48,
    color: palette.slate400,
  },
  noImageText: {
    fontSize: 13,
    color: palette.slate500,
    marginTop: 6,
  },
  floatingTopNav: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circularIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  navIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#002f34',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  imageCounterText: {
    color: palette.pureWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  viewsBanner: {
    backgroundColor: '#002f34',
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  viewsBannerText: {
    color: palette.pureWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: palette.pureWhite,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  wishlistHeartBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  wishlistHeartText: {
    fontSize: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate900,
    marginVertical: 4,
    lineHeight: 26,
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: '#002f34',
    marginVertical: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  location: {
    fontSize: 12,
    color: palette.slate600,
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: palette.slate400,
  },
  sectionCard: {
    backgroundColor: palette.pureWhite,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.slate700,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  attributeItem: {
    width: '47%',
    backgroundColor: palette.slate50,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  attributeKey: {
    fontSize: 10,
    color: palette.slate500,
    fontWeight: '600',
  },
  attributeVal: {
    fontSize: 13,
    color: palette.slate800,
    fontWeight: '700',
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.brand200,
    marginRight: spacing.md,
  },
  sellerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.brand600,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate900,
  },
  verifiedCheck: {
    fontSize: 12,
    color: '#3897f0',
    fontWeight: '900',
  },
  viewProfileText: {
    fontSize: 12,
    color: palette.brand600,
    marginTop: 2,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.pureWhite,
    borderTopWidth: 1,
    borderTopColor: palette.slate200,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  chatButton: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#002f34',
    backgroundColor: palette.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    color: '#002f34',
    fontSize: 15,
    fontWeight: '700',
  },
  callButton: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    color: palette.pureWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.pureWhite,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: palette.slate600,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#002f34',
    borderRadius: radii.full,
  },
  backButtonText: {
    color: palette.pureWhite,
    fontWeight: '600',
  },
  videoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reelWatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f8',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#23e5db',
  },
  reelPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reelPlayIcon: {
    color: palette.pureWhite,
    fontSize: 18,
    marginLeft: 2,
  },
  reelWatchInfo: {
    flex: 1,
  },
  reelWatchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
  },
  reelWatchSubtitle: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
  },
  ownerNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#002f34',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  ownerNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerCrownIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  ownerNoticeTitle: {
    color: palette.pureWhite,
    fontSize: 13,
    fontWeight: '800',
  },
  ownerNoticeDesc: {
    color: palette.slate300,
    fontSize: 11,
  },
  ownerHeaderEditBtn: {
    backgroundColor: palette.pureWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  ownerHeaderEditBtnText: {
    color: '#002f34',
    fontSize: 12,
    fontWeight: '700',
  },
  ownerAddReelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f8',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#002f34',
  },
  ownerAddReelIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  ownerAddReelInfo: {
    flex: 1,
  },
  ownerAddReelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002f34',
  },
  ownerAddReelDesc: {
    fontSize: 11,
    color: palette.slate600,
    marginTop: 2,
    lineHeight: 16,
  },
  ownerPrimaryEditBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerPrimaryEditBtnText: {
    color: palette.pureWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  ownerSecondaryMediaBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#002f34',
    backgroundColor: palette.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerSecondaryMediaBtnText: {
    color: '#002f34',
    fontSize: 14,
    fontWeight: '700',
  },
});
