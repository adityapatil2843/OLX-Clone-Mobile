import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { palette, radii, spacing } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  useReelsQuery,
  useLikeReelMutation,
  useSaveReelMutation,
  useReelCommentsQuery,
  useAddReelCommentMutation,
} from '../../hooks/useReels';
import { Reel } from '../../services/reels.service';
import { formatCompactCount, formatCurrencyINR, formatRelativeTime } from '../../utils/formatters';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

function SingleReelPlayer({
  item,
  isActive,
  onOpenComments,
}: {
  item: Reel;
  isActive: boolean;
  onOpenComments: (reel: Reel) => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const likeMutation = useLikeReelMutation();
  const saveMutation = useSaveReelMutation();

  const [isLikedLocal, setIsLikedLocal] = useState(Boolean(item.isLiked));
  const [likesCountLocal, setLikesCountLocal] = useState(item.likesCount || 0);
  const [isSavedLocal, setIsSavedLocal] = useState(Boolean(item.isSaved));

  // Initialize expo-video player
  const videoSource = item.videoUrl || null;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    if (isActive) {
      p.play();
    } else {
      p.pause();
    }
  });

  React.useEffect(() => {
    if (player) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, player]);

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    const nextLiked = !isLikedLocal;
    setIsLikedLocal(nextLiked);
    setLikesCountLocal((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    likeMutation.mutate({ reelId: item.id, isLiked: isLikedLocal });
  };

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    const nextSaved = !isSavedLocal;
    setIsSavedLocal(nextSaved);
    saveMutation.mutate({ reelId: item.id, isSaved: isSavedLocal });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch this product reel: "${item.title}" on Mandi Live!`,
      });
    } catch {
      // User dismissed
    }
  };

  return (
    <View style={[styles.reelPage, { height: WINDOW_HEIGHT - 60 }]}>
      {/* Background Video Player or Poster Fallback */}
      {videoSource && player ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.videoFallback]}>
          <Text style={styles.fallbackIcon}>📹</Text>
          <Text style={styles.fallbackText}>Previewing Reel</Text>
        </View>
      )}

      {/* Dimmed Gradient Overlay on Left and Bottom */}
      <View style={styles.dimmedOverlay} pointerEvents="none" />

      {/* Right Column Action Buttons (Instagram Reels layout) */}
      <View style={styles.rightActionsColumn}>
        {/* Like Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleToggleLike} activeOpacity={0.75}>
          <Text style={[styles.actionIcon, isLikedLocal && styles.heartLiked]}>
            {isLikedLocal ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionCount}>{formatCompactCount(likesCountLocal)}</Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity style={styles.actionItem} onPress={() => onOpenComments(item)} activeOpacity={0.75}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{formatCompactCount(item.commentsCount || 0)}</Text>
        </TouchableOpacity>

        {/* Save / Bookmark Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleToggleSave} activeOpacity={0.75}>
          <Text style={styles.actionIcon}>{isSavedLocal ? '🔖' : '🏷️'}</Text>
          <Text style={styles.actionCount}>{isSavedLocal ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleShare} activeOpacity={0.75}>
          <Text style={styles.actionIcon}>✈️</Text>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Left Info Overlay */}
      <View style={styles.bottomInfoOverlay}>
        {/* Creator Info */}
        <View style={styles.creatorRow}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorAvatarText}>
              {item.creator?.name ? item.creator.name[0].toUpperCase() : '👤'}
            </Text>
          </View>
          <Text style={styles.creatorName}>{item.creator?.name || 'Seller'}</Text>
          {item.creator?.isVerifiedSeller && (
            <View style={styles.verifiedTick}>
              <Text style={styles.verifiedTickText}>✓</Text>
            </View>
          )}
        </View>

        {/* Reel Title / Description */}
        <Text style={styles.reelTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.reelDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Linked Listing Pill Button */}
        {item.listingId && item.listing && (
          <TouchableOpacity
            style={styles.linkedListingPill}
            onPress={() => router.push(`/listing/${item.listingId}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.pillPrice}>{formatCurrencyINR(item.listing.price)}</Text>
            <Text style={styles.pillDivider}>•</Text>
            <Text style={styles.pillTitle} numberOfLines={1}>
              {item.listing.title}
            </Text>
            <Text style={styles.pillArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentReel, setCommentReel] = useState<Reel | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: reelsData, isLoading, refetch } = useReelsQuery();
  const reels = reelsData?.data || [];

  const { data: comments, isLoading: isCommentsLoading } = useReelCommentsQuery(commentReel?.id || '');
  const addCommentMutation = useAddReelCommentMutation();

  const handleSendComment = () => {
    if (!commentReel || !commentText.trim()) return;
    addCommentMutation.mutate(
      { reelId: commentReel.id, text: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
        },
      }
    );
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header Floating Overlay (Instagram Reels Style) */}
      <View style={[styles.topHeader, { top: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => router.push('/listing/create')}
        >
          <Text style={styles.topIcon}>+</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Reels</Text>
        <TouchableOpacity style={styles.topIconBtn} onPress={() => refetch()}>
          <Text style={styles.topIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={palette.pureWhite} />
          <Text style={styles.loadingText}>Loading video feed...</Text>
        </View>
      ) : reels.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyIcon}>📹</Text>
          <Text style={styles.emptyTitle}>No reels posted yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to record and showcase your product in 60s video!</Text>
          <TouchableOpacity
            style={styles.createReelBtn}
            onPress={() => router.push('/listing/create')}
          >
            <Text style={styles.createReelBtnText}>+ Create Reel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / (WINDOW_HEIGHT - 60));
            setActiveIndex(index);
          }}
          renderItem={({ item, index }) => (
            <SingleReelPlayer
              item={item}
              isActive={index === activeIndex}
              onOpenComments={(r) => setCommentReel(r)}
            />
          )}
        />
      )}

      {/* Comments Modal Bottom Sheet */}
      <Modal
        visible={Boolean(commentReel)}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentReel(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setCommentReel(null)}
          />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>Comments</Text>

            {isCommentsLoading ? (
              <ActivityIndicator size="small" color={palette.brand500} style={{ margin: 20 }} />
            ) : !comments || comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>No comments yet. Start the conversation!</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {item.user?.name ? item.user.name[0].toUpperCase() : '👤'}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentNameTimeRow}>
                        <Text style={styles.commentAuthor}>{item.user?.name || 'Buyer'}</Text>
                        <Text style={styles.commentTime}>{formatRelativeTime(item.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Comment Input Bar */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={palette.slate400}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={[styles.sendCommentBtn, !commentText.trim() && styles.sendCommentBtnDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
              >
                <Text style={styles.sendCommentText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  topHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.pureWhite,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIcon: {
    color: palette.pureWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  reelPage: {
    width: SCREEN_WIDTH,
    position: 'relative',
    justifyContent: 'flex-end',
    backgroundColor: '#000',
  },
  videoFallback: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: 54,
    marginBottom: 8,
  },
  fallbackText: {
    color: palette.slate400,
    fontSize: 14,
  },
  dimmedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  rightActionsColumn: {
    position: 'absolute',
    right: 14,
    bottom: 80,
    alignItems: 'center',
    gap: 18,
    zIndex: 5,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heartLiked: {
    transform: [{ scale: 1.1 }],
  },
  actionCount: {
    color: palette.pureWhite,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfoOverlay: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
    width: '78%',
    zIndex: 5,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  creatorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.brand500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: palette.pureWhite,
  },
  creatorAvatarText: {
    color: palette.pureWhite,
    fontWeight: '800',
    fontSize: 14,
  },
  creatorName: {
    color: palette.pureWhite,
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verifiedTick: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3897f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  verifiedTickText: {
    color: palette.pureWhite,
    fontSize: 9,
    fontWeight: '900',
  },
  reelTitle: {
    color: palette.pureWhite,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reelDescription: {
    color: palette.slate200,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  linkedListingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  pillPrice: {
    fontWeight: '800',
    color: '#002f34',
    fontSize: 12,
  },
  pillDivider: {
    marginHorizontal: 6,
    color: palette.slate400,
  },
  pillTitle: {
    color: palette.slate800,
    fontSize: 11,
    maxWidth: 120,
    fontWeight: '500',
  },
  pillArrow: {
    fontSize: 14,
    color: palette.slate600,
    marginLeft: 4,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: palette.slate300,
    marginTop: spacing.md,
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.pureWhite,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: palette.slate400,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  createReelBtn: {
    backgroundColor: palette.brand500,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  createReelBtnText: {
    color: palette.pureWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: palette.pureWhite,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '65%',
    paddingTop: spacing.sm,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.slate300,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate900,
    textAlign: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  commentsList: {
    paddingHorizontal: spacing.lg,
    maxHeight: 280,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontWeight: '700',
    fontSize: 12,
    color: palette.slate700,
  },
  commentContent: {
    flex: 1,
  },
  commentNameTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slate800,
  },
  commentTime: {
    fontSize: 10,
    color: palette.slate400,
  },
  commentText: {
    fontSize: 13,
    color: palette.slate700,
    marginTop: 2,
  },
  emptyComments: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 13,
    color: palette.slate400,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: palette.slate100,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: palette.slate800,
  },
  sendCommentBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  sendCommentBtnDisabled: {
    opacity: 0.4,
  },
  sendCommentText: {
    fontWeight: '700',
    color: palette.brand600,
    fontSize: 13,
  },
});
