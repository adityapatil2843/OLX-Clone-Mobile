import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Linking, Share,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing } from '../../constants/tokens';
import { Badge } from '../../components/ui/Badge';
import { useListingDetailQuery } from '../../hooks/useListings';
import { useToggleWishlistMutation } from '../../hooks/useWishlist';
import { useCreateConversationMutation } from '../../hooks/useChat';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatCurrencyINR, formatRelativeTime } from '../../utils/formatters';
import { ArrowLeft, Share2, Heart, MapPin, MessageSquare, Phone, Pencil, Camera, Video, Clapperboard, ShieldCheck, Crown, AlertCircle, ImageOff, CheckCircle, User, Zap,
} from 'lucide-react-native';
import { BoostModal } from '../../components/boost/BoostModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);

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
        <AlertCircle size={44} color={palette.slate400} style={{ marginBottom: 12 }} />
        <Text style={styles.errorTitle}>Listing not found</Text>
        <Text style={styles.errorSubtitle}>This ad may have been removed or sold by the owner.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Go Back</Text>
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
        message: `Check out "${listing.title}" for ${formatCurrencyINR(listing.price)} on Bazarr 360!`,
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
                  <ExpoImage
                    key={media.id || idx}
                    source={{ uri: optimizeCloudinaryUrl(imgUri || 'https://via.placeholder.com/600x400') }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    transition={150}
                  />
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noImageContainer}>
              <ImageOff size={40} color={palette.slate400} style={{ marginBottom: 8 }} />
              <Text style={styles.noImageText}>No photos provided for this listing</Text>
            </View>
          )}

          {/* Floating Top Nav (Back & Share) */}
          <View style={[styles.floatingTopNav, { top: Math.max(insets.top, 10) }]}>
            <TouchableOpacity style={styles.circularIconBtn} onPress={() => router.back()}>
              <ArrowLeft size={18} color="#002f34" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circularIconBtn} onPress={handleShare}>
              <Share2 size={18} color="#002f34" />
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
          <ShieldCheck size={15} color="#002f34" style={{ marginRight: 6 }} />
          <Text style={styles.viewsBannerText}>
            Verified listing • Direct seller contact available
          </Text>
        </View>

        {/* Listing Title, Price & Badges Card */}
        <View style={styles.detailsCard}>
          {isOwner && (
            <View style={styles.ownerNoticeBanner}>
              <View style={styles.ownerNoticeLeft}>
                <Crown size={22} color="#eab308" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.ownerNoticeTitle}>You own this listing</Text>
                  <Text style={styles.ownerNoticeDesc}>Manage photos, video reel, and price</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.ownerHeaderBoostBtn}
                  onPress={() => setIsBoostModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Zap size={12} color="#002f34" style={{ marginRight: 3 }} />
                  <Text style={styles.ownerHeaderBoostBtnText}>Boost</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ownerHeaderEditBtn}
                  onPress={() => router.push(`/listing/edit/${listing.id}`)}
                  activeOpacity={0.8}
                >
                  <Pencil size={12} color="#002f34" style={{ marginRight: 3 }} />
                  <Text style={styles.ownerHeaderEditBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.badgeRow}>
            {listing.owner?.isVerifiedSeller && (
              <Badge label="👑 ELITE SELLER" variant="brand" style={{ marginRight: 6 }} />
            )}
            <Badge label={listing.status} variant={listing.status === 'ACTIVE' ? 'success' : 'default'} />
            <TouchableOpacity style={styles.wishlistHeartBtn} onPress={handleToggleWishlist}>
              <Heart
                size={22}
                color={listing.isWishlisted ? palette.danger500 : palette.slate400}
                fill={listing.isWishlisted ? palette.danger500 : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatCurrencyINR(listing.price)}</Text>

          <View style={styles.metaRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
              <MapPin size={13} color={palette.slate500} style={{ marginRight: 4 }} />
              <Text style={styles.location}>
                {[listing.locationLocality, listing.locationCity, listing.locationState].filter(Boolean).join(', ')}
              </Text>
            </View>
            <Text style={styles.date}>Posted {formatRelativeTime(listing.createdAt)}</Text>
          </View>
        </View>

        {/* Product Video Reel Showcase if attached */}
        {listing.reels && listing.reels.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.videoSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Video size={18} color="#002f34" style={{ marginRight: 6 }} />
                <Text style={styles.sectionHeading}>Video Showcase</Text>
              </View>
              <Badge label="REEL LIVE" variant="brand" />
            </View>
            <TouchableOpacity
              style={styles.reelWatchBanner}
              onPress={() => router.push(`/reel/${listing.reels![0].id}`)}
              activeOpacity={0.85}
            >
              {listing.reels![0].thumbnailUrl ? (
                <View style={{ position: 'relative', marginRight: 12 }}>
                  <ExpoImage
                    source={{ uri: optimizeCloudinaryUrl(listing.reels![0].thumbnailUrl) }}
                    style={{ width: 56, height: 56, borderRadius: radii.md }}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={[styles.reelPlayCircle, { position: 'absolute', width: 28, height: 28, borderRadius: 14, top: 14, left: 14 }]}>
                    <Text style={[styles.reelPlayIcon, { fontSize: 10 }]}>▶</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.reelPlayCircle}>
                  <Text style={styles.reelPlayIcon}>▶</Text>
                </View>
              )}
              <View style={styles.reelWatchInfo}>
                <Text style={styles.reelWatchTitle}>Watch Product Video Reel</Text>
                <Text style={styles.reelWatchSubtitle}>Tap to watch video showcase on Bazarr Reels</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : isOwner ? (
          /* Owner Callout to Add Reel Later */
          <View style={styles.sectionCard}>
            <View style={styles.videoSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Video size={18} color="#002f34" style={{ marginRight: 6 }} />
                <Text style={styles.sectionHeading}>Video Reel</Text>
              </View>
              <Badge label="BOOST INQUIRIES" variant="brand" />
            </View>
            <TouchableOpacity
              style={styles.ownerAddReelBanner}
              onPress={() => router.push(`/listing/edit/${listing.id}`)}
              activeOpacity={0.85}
            >
              <Clapperboard size={24} color="#002f34" style={{ marginRight: 12 }} />
              <View style={styles.ownerAddReelInfo}>
                <Text style={styles.ownerAddReelTitle}>+ Add a 60s Video Reel</Text>
                <Text style={styles.ownerAddReelDesc}>
                  Upload in MP4, MOV, or WebM format. Video listings appear on the Bazarr Reels screen and get 4x more buyers!
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
              {listing.owner?.avatarUrl ? (
                <ExpoImage
                  source={{ uri: optimizeCloudinaryUrl(listing.owner.avatarUrl) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={150}
                />
              ) : listing.owner?.name ? (
                <Text style={styles.sellerAvatarText}>
                  {listing.owner.name[0].toUpperCase()}
                </Text>
              ) : (
                <User size={20} color="#002f34" />
              )}
            </View>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.owner?.name || 'Seller'}</Text>
                {listing.owner?.isVerifiedSeller && (
                  <CheckCircle size={14} color="#002f34" style={{ marginLeft: 4 }} />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Pencil size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.ownerPrimaryEditBtnText}>Edit Product</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ownerBoostBottomBtn}
              onPress={() => setIsBoostModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="#002f34" style={{ marginRight: 6 }} />
                <Text style={styles.ownerBoostBottomBtnText}>Boost</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ownerSecondaryMediaBtn}
              onPress={() => router.push(`/listing/edit/${listing.id}`)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {listing.reels && listing.reels.length > 0 ? (
                  <>
                    <Camera size={15} color="#002f34" style={{ marginRight: 6 }} />
                    <Text style={styles.ownerSecondaryMediaBtnText}>Add Photos</Text>
                  </>
                ) : (
                  <>
                    <Video size={15} color="#002f34" style={{ marginRight: 6 }} />
                    <Text style={styles.ownerSecondaryMediaBtnText}>+ Add Reel</Text>
                  </>
                )}
              </View>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={16} color="#002f34" style={{ marginRight: 6 }} />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.callButtonText}>Call</Text>
              </View>
            </TouchableOpacity>
          
          </>
        )}
      </View>

      {/* Boost Modal (strictly owner only) */}
      {isOwner && (
        <BoostModal
          visible={isBoostModalOpen}
          onClose={() => setIsBoostModalOpen(false)}
          target={{
            type: 'LISTING',
            id: listing.id,
            title: listing.title,
          }}
        />
      )}
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
    overflow: 'hidden',
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
  ownerHeaderBoostBtn: {
    backgroundColor: '#ffce32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  ownerHeaderBoostBtnText: {
    color: '#002f34',
    fontSize: 12,
    fontWeight: '800',
  },
  ownerHeaderEditBtn: {
    backgroundColor: palette.pureWhite,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  ownerHeaderEditBtnText: {
    color: '#002f34',
    fontSize: 12,
    fontWeight: '700',
  },
  ownerBoostBottomBtn: {
    flex: 0.9,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: '#ffce32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerBoostBottomBtnText: {
    color: '#002f34',
    fontSize: 14,
    fontWeight: '800',
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
