import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  ViewToken,
  AppState,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image as ExpoImage } from 'expo-image';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';
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
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  User,
  Check,
  ChevronRight,
  Plus,
  RotateCw,
  Video,
  Play,
  AlertCircle,
  Clock,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = WINDOW_HEIGHT - 60;

type NormalizedReelStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

function normalizeReelStatus(item: Reel): NormalizedReelStatus {
  const s = (item.status || '').toUpperCase();
  if (s === 'READY' || s === 'PUBLISHED') return 'READY';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'PENDING') return 'PENDING';
  if (s === 'PROCESSING') return 'PROCESSING';
  if (s === 'DRAFT') return 'PENDING';
  // Backward compatibility: If no status was returned but media URL exists, treat as READY
  if (item.videoUrl || item.hlsUrl) return 'READY';
  return 'PROCESSING';
}

function rewindPlayer(playerInstance: any) {
  try {
    playerInstance.currentTime = 0;
  } catch {}
}

const REELS_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 75,
};

interface ReadyReelPlayerProps {
  item: Reel;
  isActive: boolean;
  isScreenFocused: boolean;
  isAppActive: boolean;
  isPaused: boolean;
  onTogglePlayPause: () => void;
}

function ReadyReelPlayer({
  item,
  isActive,
  isScreenFocused,
  isAppActive,
  isPaused,
  onTogglePlayPause,
}: ReadyReelPlayerProps) {
  const primarySource = item.hlsUrl || item.videoUrl || null;
  const fallbackSource =
    item.hlsUrl && item.videoUrl && item.videoUrl !== item.hlsUrl ? item.videoUrl : null;

  const [currentSource, setCurrentSource] = useState<string | null>(primarySource);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const shouldPlay = isActive && isScreenFocused && isAppActive && !isPaused && !playbackError;

  // Initialize expo-video player with current source (HLS preferred, MP4 fallback)
  const player = useVideoPlayer(currentSource, (p) => {
    p.loop = true;
    if (shouldPlay) {
      p.play();
    } else {
      p.pause();
    }
  });

  // Autoplay / pause synchronization
  useEffect(() => {
    if (!player) return;
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, player]);

  // When inactive or leaving active view: pause and seek back to 0
  useEffect(() => {
    if (!isActive && player) {
      player.pause();
      rewindPlayer(player);
    }
  }, [isActive, player]);

  const handlePlayerError = useCallback(
    (errMsg?: string) => {
      // If primary HLS fails and MP4 fallback is available, seamlessly switch
      if (!isUsingFallback && fallbackSource && player) {
        setIsUsingFallback(true);
        setCurrentSource(fallbackSource);
        setIsVideoLoading(true);
        setPlaybackError(null);
        try {
          player.replaceAsync(fallbackSource);
        } catch {
          player.replace(fallbackSource);
        }
        return;
      }
      setIsVideoLoading(false);
      setPlaybackError(errMsg || 'Video playback failed. Tap to retry.');
    },
    [isUsingFallback, fallbackSource, player]
  );

  // Monitor player status and playback changes
  useEffect(() => {
    if (!player) return;

    queueMicrotask(() => {
      if (player.status === 'readyToPlay') {
        setIsVideoLoading(false);
        setPlaybackError(null);
      } else if (player.status === 'loading') {
        setIsVideoLoading(true);
      } else if (player.status === 'error') {
        handlePlayerError();
      }
    });

    const statusSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setIsVideoLoading(false);
        setPlaybackError(null);
      } else if (payload.status === 'loading') {
        setIsVideoLoading(true);
      } else if (payload.status === 'error') {
        handlePlayerError(payload.error?.message);
      }
    });

    const playingSub = player.addListener('playingChange', (payload) => {
      if (payload.isPlaying) {
        setIsVideoLoading(false);
      }
    });

    return () => {
      statusSub?.remove?.();
      playingSub?.remove?.();
    };
  }, [player, handlePlayerError]);

  const handleRetryPlayback = () => {
    if (!player || !primarySource) return;
    setPlaybackError(null);
    setIsVideoLoading(true);
    setIsUsingFallback(false);
    setCurrentSource(primarySource);
    try {
      player.replaceAsync(primarySource);
    } catch {
      player.replace(primarySource);
    }
  };

  const posterUrl = item.customThumbnailUrl || item.thumbnailUrl;

  return (
    <>
      {/* Background Poster / Thumbnail while loading or as fallback */}
      {posterUrl ? (
        <ExpoImage source={{ uri: optimizeCloudinaryUrl(posterUrl) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.videoFallback]}>
          <Video size={48} color={palette.slate400} strokeWidth={1.5} style={{ marginBottom: 8 }} />
          <Text style={styles.fallbackText}>Product Reel</Text>
        </View>
      )}

      {/* Active Video Player View */}
      {currentSource && !playbackError ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}

      {/* Loading Spinner while buffering */}
      {isVideoLoading && isActive && !isPaused && !playbackError && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.loadingCircleBg}>
            <ActivityIndicator size="large" color={palette.pureWhite} />
          </View>
        </View>
      )}

      {/* Playback Error Overlay with Retry */}
      {playbackError && (
        <View style={styles.centerOverlay}>
          <View style={styles.statusBox}>
            <AlertCircle size={32} color="#ff4d4f" style={{ marginBottom: 8 }} />
            <Text style={styles.statusBoxTitle}>Playback Error</Text>
            <Text style={styles.statusBoxDesc}>{playbackError}</Text>
            <TouchableOpacity style={styles.statusRetryBtn} onPress={handleRetryPlayback}>
              <Text style={styles.statusRetryText}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

function ProcessingReelView({
  item,
  status,
}: {
  item: Reel;
  status: 'PENDING' | 'PROCESSING';
}) {
  const posterUrl = item.customThumbnailUrl || item.thumbnailUrl;
  const isPending = status === 'PENDING';

  return (
    <>
      {posterUrl ? (
        <ExpoImage source={{ uri: optimizeCloudinaryUrl(posterUrl) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.videoFallback]}>
          <Video size={48} color={palette.slate400} strokeWidth={1.5} style={{ marginBottom: 8 }} />
        </View>
      )}
      <View style={styles.dimmedOverlay} pointerEvents="none" />
      <View style={styles.centerOverlay} pointerEvents="none">
        <View style={styles.statusBox}>
          <Clock size={32} color={palette.pureWhite} style={{ marginBottom: 8 }} />
          <Text style={styles.statusBoxTitle}>
            {isPending ? 'Upload Queued' : 'Video Processing'}
          </Text>
          <Text style={styles.statusBoxDesc}>
            {isPending
              ? 'This reel is queued for processing. Check back shortly.'
              : 'Cloudinary is optimizing this video for adaptive playback.'}
          </Text>
        </View>
      </View>
    </>
  );
}

function FailedReelView({ item, onRetry }: { item: Reel; onRetry?: () => void }) {
  const posterUrl = item.customThumbnailUrl || item.thumbnailUrl;

  return (
    <>
      {posterUrl ? (
        <ExpoImage source={{ uri: optimizeCloudinaryUrl(posterUrl) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.videoFallback]}>
          <Video size={48} color={palette.slate400} strokeWidth={1.5} style={{ marginBottom: 8 }} />
        </View>
      )}
      <View style={styles.dimmedOverlay} pointerEvents="none" />
      <View style={styles.centerOverlay}>
        <View style={styles.statusBox}>
          <AlertCircle size={32} color="#ff4d4f" style={{ marginBottom: 8 }} />
          <Text style={styles.statusBoxTitle}>Processing Failed</Text>
          <Text style={styles.statusBoxDesc}>
            {item.processingError || 'This reel could not be processed by Cloudinary.'}
          </Text>
          {onRetry && (
            <TouchableOpacity style={styles.statusRetryBtn} onPress={onRetry}>
              <Text style={styles.statusRetryText}>Reload Feed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

interface SingleReelPlayerProps {
  item: Reel;
  index: number;
  isActive: boolean;
  isScreenFocused: boolean;
  isAppActive: boolean;
  onOpenComments: (reel: Reel) => void;
  onRetry?: () => void;
}

function SingleReelPlayerComponent({
  item,
  isActive,
  isScreenFocused,
  isAppActive,
  onOpenComments,
  onRetry,
}: SingleReelPlayerProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const likeMutation = useLikeReelMutation();
  const saveMutation = useSaveReelMutation();

  const [isLikedLocal, setIsLikedLocal] = useState(Boolean(item.isLiked));
  const [likesCountLocal, setLikesCountLocal] = useState(item.likesCount || 0);
  const [isSavedLocal, setIsSavedLocal] = useState(Boolean(item.isSaved));
  const [isPaused, setIsPaused] = useState(false);

  // Synchronize local like/save states if item updates
  useEffect(() => {
    queueMicrotask(() => {
      setIsLikedLocal(Boolean(item.isLiked));
      setLikesCountLocal(item.likesCount || 0);
      setIsSavedLocal(Boolean(item.isSaved));
    });
  }, [item.isLiked, item.likesCount, item.isSaved]);

  // Reset paused state when reel loses active visibility
  useEffect(() => {
    if (!isActive || !isScreenFocused || !isAppActive) {
      queueMicrotask(() => {
        setIsPaused(false);
      });
    }
  }, [isActive, isScreenFocused, isAppActive]);

  const normalizedStatus = normalizeReelStatus(item);

  const handleTogglePlayPause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleCreatorPress = () => {
    const creatorId = item.creator?.id || item.creatorId;
    if (creatorId) {
      router.push(`/profile/${creatorId}`);
    }
  };

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
        message: `Watch this product reel: "${item.title || item.caption || 'Product Reel'}" on Bazarr 360!`,
      });
    } catch {
      // User dismissed
    }
  };

  return (
    <View style={[styles.reelPage, { height: ITEM_HEIGHT }]}>
      {/* Visual content based on verified lifecycle status */}
      {normalizedStatus === 'READY' ? (
        <ReadyReelPlayer
          item={item}
          isActive={isActive}
          isScreenFocused={isScreenFocused}
          isAppActive={isAppActive}
          isPaused={isPaused}
          onTogglePlayPause={handleTogglePlayPause}
        />
      ) : normalizedStatus === 'FAILED' ? (
        <FailedReelView item={item} onRetry={onRetry} />
      ) : (
        <ProcessingReelView item={item} status={normalizedStatus} />
      )}

      {/* Dimmed Gradient Overlay on Left and Bottom */}
      <View style={styles.dimmedOverlay} pointerEvents="none" />

      {/* Play/Pause tap area for playable reels */}
      {normalizedStatus === 'READY' && (
        <TouchableOpacity
          style={styles.touchableVideoArea}
          activeOpacity={1}
          onPress={handleTogglePlayPause}
        />
      )}

      {/* Play Button Icon Popup in Center when Paused */}
      {isPaused && normalizedStatus === 'READY' && (
        <TouchableOpacity
          style={styles.centerOverlay}
          activeOpacity={0.8}
          onPress={handleTogglePlayPause}
        >
          <View style={styles.playButtonCircle}>
            <Play size={38} color={palette.pureWhite} fill={palette.pureWhite} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>
      )}

      {/* Right Column Action Buttons */}
      <View style={styles.rightActionsColumn}>
        {/* Like Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleToggleLike} activeOpacity={0.75}>
          <View style={styles.actionIconWrapper}>
            <Heart
              size={28}
              color={isLikedLocal ? '#ff3040' : palette.pureWhite}
              fill={isLikedLocal ? '#ff3040' : 'transparent'}
              strokeWidth={2}
            />
          </View>
          <Text style={styles.actionCount}>{formatCompactCount(likesCountLocal)}</Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity style={styles.actionItem} onPress={() => onOpenComments(item)} activeOpacity={0.75}>
          <View style={styles.actionIconWrapper}>
            <MessageCircle size={28} color={palette.pureWhite} strokeWidth={2} />
          </View>
          <Text style={styles.actionCount}>{formatCompactCount(item.commentsCount || 0)}</Text>
        </TouchableOpacity>

        {/* Save / Bookmark Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleToggleSave} activeOpacity={0.75}>
          <View style={styles.actionIconWrapper}>
            <Bookmark
              size={28}
              color={isSavedLocal ? '#ffce32' : palette.pureWhite}
              fill={isSavedLocal ? '#ffce32' : 'transparent'}
              strokeWidth={2}
            />
          </View>
          <Text style={styles.actionCount}>{isSavedLocal ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleShare} activeOpacity={0.75}>
          <View style={styles.actionIconWrapper}>
            <Send size={26} color={palette.pureWhite} strokeWidth={2} />
          </View>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Left Info Overlay */}
      <View style={styles.bottomInfoOverlay}>
        {/* Creator Info */}
        <TouchableOpacity
          style={styles.creatorRow}
          onPress={handleCreatorPress}
          activeOpacity={0.7}
        >
          <View style={styles.creatorAvatar}>
            {item.creator?.avatarUrl ? (
              <ExpoImage
                source={{ uri: optimizeCloudinaryUrl(item.creator.avatarUrl) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={150}
              />
            ) : item.creator?.name ? (
              <Text style={styles.creatorAvatarText}>
                {item.creator.name[0].toUpperCase()}
              </Text>
            ) : (
              <User size={16} color={palette.pureWhite} />
            )}
          </View>
          <Text style={styles.creatorName}>{item.creator?.name || 'Seller'}</Text>
          {item.creator?.isVerifiedSeller && (
            <View style={styles.verifiedTick}>
              <Check size={9} color={palette.pureWhite} strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>

        {/* Reel Title / Description */}
        <Text style={styles.reelTitle} numberOfLines={2}>
          {item.title || item.caption || 'Product Reel'}
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
            <ChevronRight size={14} color={palette.slate600} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Memoized item to prevent unnecessary re-renders of inactive Reel items
const SingleReelPlayer = memo(
  SingleReelPlayerComponent,
  (prev, next) =>
    prev.isActive === next.isActive &&
    prev.isScreenFocused === next.isScreenFocused &&
    prev.isAppActive === next.isAppActive &&
    prev.item.id === next.item.id &&
    prev.item.status === next.item.status &&
    prev.item.videoUrl === next.item.videoUrl &&
    prev.item.hlsUrl === next.item.hlsUrl &&
    prev.item.thumbnailUrl === next.item.thumbnailUrl &&
    prev.item.customThumbnailUrl === next.item.customThumbnailUrl &&
    prev.item.isLiked === next.item.isLiked &&
    prev.item.isSaved === next.item.isSaved &&
    prev.item.likesCount === next.item.likesCount &&
    prev.item.commentsCount === next.item.commentsCount
);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [commentReel, setCommentReel] = useState<Reel | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: reelsData, isLoading, refetch } = useReelsQuery();
  const reels = reelsData?.data || [];

  // Pause audio/video immediately when tab loses focus and resume only when tab regains focus
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      refetch();

      return () => {
        setIsScreenFocused(false);
      };
    }, [refetch])
  );

  // Monitor app background / active state to halt playback when backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      setIsAppActive(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null && viewableItems[0].index !== undefined) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

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
          onPress={() => router.push('/reel/create')}
        >
          <Plus size={20} color={palette.pureWhite} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Bazarr Reels</Text>
        <TouchableOpacity style={styles.topIconBtn} onPress={() => refetch()}>
          <RotateCw size={18} color={palette.pureWhite} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={palette.pureWhite} />
          <Text style={styles.loadingText}>Loading video feed...</Text>
        </View>
      ) : reels.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Video size={52} color={palette.slate400} strokeWidth={1.5} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyTitle}>No reels posted yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to record and showcase your product in 60s video!</Text>
          <TouchableOpacity
            style={styles.createReelBtn}
            onPress={() => router.push('/reel/create')}
          >
            <Plus size={16} color={palette.pureWhite} strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.createReelBtnText}>Create Reel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={REELS_VIEWABILITY_CONFIG}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews={Platform.OS === 'android' ? false : true}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            if (index >= 0 && index < reels.length) {
              setActiveIndex(index);
            }
          }}
          renderItem={({ item, index }) => (
            <SingleReelPlayer
              item={item}
              index={index}
              isActive={index === activeIndex}
              isScreenFocused={isScreenFocused}
              isAppActive={isAppActive}
              onOpenComments={(r) => setCommentReel(r)}
              onRetry={() => refetch()}
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
                      {item.user?.avatarUrl ? (
                        <ExpoImage
                          source={{ uri: optimizeCloudinaryUrl(item.user.avatarUrl) }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          transition={150}
                        />
                      ) : item.user?.name ? (
                        <Text style={styles.commentAvatarText}>
                          {item.user.name[0].toUpperCase()}
                        </Text>
                      ) : (
                        <User size={16} color={palette.slate600} />
                      )}
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
  touchableVideoArea: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  playButtonCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  loadingCircleBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusBoxTitle: {
    color: palette.pureWhite,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusBoxDesc: {
    color: palette.slate300,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusRetryBtn: {
    marginTop: spacing.sm,
    backgroundColor: palette.brand500,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  statusRetryText: {
    color: palette.pureWhite,
    fontWeight: '700',
    fontSize: 12,
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
  actionIconWrapper: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
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
