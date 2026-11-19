import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing } from '../../constants/tokens';
import { useReelDetailQuery } from '../../hooks/useReels';
import { useVideoPlayer, VideoView } from 'expo-video';
import { formatCurrencyINR } from '../../utils/formatters';
import { Play, AlertCircle, Clock, Video, Zap, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { Reel } from '../../services/reels.service';
import { useAuthStore } from '../../stores/useAuthStore';
import { BoostModal } from '../../components/boost/BoostModal';

type NormalizedStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

function normalizeReelStatus(item: Reel): NormalizedStatus {
  const s = (item.status || '').toUpperCase();
  if (s === 'READY' || s === 'PUBLISHED') return 'READY';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'PENDING') return 'PENDING';
  if (s === 'PROCESSING') return 'PROCESSING';
  if (s === 'DRAFT') return 'PENDING';
  if (item.videoUrl || item.hlsUrl) return 'READY';
  return 'PROCESSING';
}

function ReadySingleVideoPlayer({
  reel,
  isScreenFocused,
  isAppActive,
}: {
  reel: Reel;
  isScreenFocused: boolean;
  isAppActive: boolean;
}) {
  const primarySource = reel.hlsUrl || reel.videoUrl || null;
  const fallbackSource =
    reel.hlsUrl && reel.videoUrl && reel.videoUrl !== reel.hlsUrl ? reel.videoUrl : null;

  const [currentSource, setCurrentSource] = useState<string | null>(primarySource);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const shouldPlay = isScreenFocused && isAppActive && !isPaused && !playbackError;

  const player = useVideoPlayer(currentSource, (p) => {
    p.loop = true;
    if (shouldPlay) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    if (!player) return;
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, player]);

  const handlePlayerError = useCallback(
    (errMsg?: string) => {
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
      setPlaybackError(errMsg || 'Video playback failed');
    },
    [isUsingFallback, fallbackSource, player]
  );

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

  const handleTogglePlayPause = () => {
    setIsPaused((prev) => !prev);
  };

  const posterUrl = reel.customThumbnailUrl || reel.thumbnailUrl;

  return (
    <>
      {posterUrl ? (
        <ExpoImage
          source={{ uri: optimizeCloudinaryUrl(posterUrl) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <Video size={48} color={palette.slate400} strokeWidth={1.5} style={{ marginBottom: 8 }} />
          <Text style={{ color: palette.slate400 }}>No video preview available</Text>
        </View>
      )}

      {currentSource && !playbackError ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}

      <TouchableOpacity
        style={styles.touchableArea}
        activeOpacity={1}
        onPress={handleTogglePlayPause}
      />

      {isVideoLoading && !isPaused && !playbackError && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.loadingCircleBg}>
            <ActivityIndicator size="large" color={palette.pureWhite} />
          </View>
        </View>
      )}

      {isPaused && !playbackError && (
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

      {playbackError && (
        <View style={styles.centerOverlay}>
          <View style={styles.statusBox}>
            <AlertCircle size={32} color="#ff4d4f" style={{ marginBottom: 8 }} />
            <Text style={styles.statusBoxTitle}>Playback Error</Text>
            <Text style={styles.statusBoxDesc}>{playbackError}</Text>
          </View>
        </View>
      )}
    </>
  );
}

export default function SingleReelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);

  const { data: reel, isLoading, error, refetch } = useReelDetailQuery(id || '');

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      setIsAppActive(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.pureWhite} />
        <Text style={styles.loadingText}>Loading reel...</Text>
      </View>
    );
  }

  if (error || !reel) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Reel not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color={palette.pureWhite} style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const normalizedStatus = normalizeReelStatus(reel);
  const posterUrl = reel.customThumbnailUrl || reel.thumbnailUrl;
  const isCreator = Boolean(
    user?.id && (user.id === reel.creatorId || user.id === reel.creator?.id)
  );

  return (
    <View style={styles.container}>
      {normalizedStatus === 'READY' ? (
        <ReadySingleVideoPlayer
          reel={reel}
          isScreenFocused={isScreenFocused}
          isAppActive={isAppActive}
        />
      ) : normalizedStatus === 'FAILED' ? (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          {posterUrl && (
            <ExpoImage
              source={{ uri: optimizeCloudinaryUrl(posterUrl) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />
          )}
          <View style={styles.dimmedOverlay} />
          <View style={styles.statusBox}>
            <AlertCircle size={36} color="#ff4d4f" style={{ marginBottom: 8 }} />
            <Text style={styles.statusBoxTitle}>Video Processing Failed</Text>
            <Text style={styles.statusBoxDesc}>
              {reel.processingError || 'This reel could not be processed.'}
            </Text>
            <TouchableOpacity style={styles.statusRetryBtn} onPress={() => refetch()}>
              <Text style={styles.statusRetryText}>Reload</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          {posterUrl && (
            <ExpoImage
              source={{ uri: optimizeCloudinaryUrl(posterUrl) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />
          )}
          <View style={styles.dimmedOverlay} />
          <View style={styles.statusBox}>
            <Clock size={36} color={palette.pureWhite} style={{ marginBottom: 8 }} />
            <Text style={styles.statusBoxTitle}>
              {normalizedStatus === 'PENDING' ? 'Upload Queued' : 'Video Processing'}
            </Text>
            <Text style={styles.statusBoxDesc}>
              {normalizedStatus === 'PENDING'
                ? 'This video is queued for processing.'
                : 'Cloudinary is optimizing this video for adaptive playback.'}
            </Text>
          </View>
        </View>
      )}

      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBack, { top: Math.max(insets.top, 12) }]}
        onPress={() => router.back()}
      >
        <ArrowLeft size={20} color={palette.pureWhite} />
      </TouchableOpacity>

      {/* Bottom Overlay */}
      <View style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text style={styles.title}>{reel.title}</Text>
        {reel.description && <Text style={styles.desc}>{reel.description}</Text>}

        <View style={styles.actionButtonsRow}>
          {reel.listing && (
            <TouchableOpacity
              style={styles.listingBtn}
              onPress={() => router.push(`/listing/${reel.listing?.id}`)}
            >
              <Text style={styles.listingBtnText}>
                View Listing • {formatCurrencyINR(reel.listing.price)}
              </Text>
              <ChevronRight size={14} color="#002f34" />
            </TouchableOpacity>
          )}

          {isCreator && (
            <TouchableOpacity
              style={styles.creatorBoostBtn}
              onPress={() => setIsBoostModalOpen(true)}
              activeOpacity={0.85}
            >
              <Zap size={13} color="#002f34" style={{ marginRight: 4 }} />
              <Text style={styles.creatorBoostBtnText}>Boost Reel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Boost Modal (strictly creator only) */}
      {isCreator && (
        <BoostModal
          visible={isBoostModalOpen}
          onClose={() => setIsBoostModalOpen(false)}
          target={{
            type: 'REEL',
            id: reel.id,
            title: reel.title || reel.caption || 'Product Reel',
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableArea: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  dimmedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  loadingText: {
    color: palette.slate400,
    marginTop: spacing.md,
  },
  errorText: {
    color: palette.pureWhite,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: palette.brand500,
    borderRadius: radii.full,
  },
  backBtnText: {
    color: palette.pureWhite,
    fontWeight: '700',
  },
  floatingBack: {
    position: 'absolute',
    left: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  title: {
    color: palette.pureWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  desc: {
    color: palette.slate300,
    fontSize: 13,
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  listingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  listingBtnText: {
    color: '#002f34',
    fontSize: 13,
    fontWeight: '700',
  },
  creatorBoostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffce32',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  creatorBoostBtnText: {
    color: '#002f34',
    fontSize: 13,
    fontWeight: '800',
  },
});
