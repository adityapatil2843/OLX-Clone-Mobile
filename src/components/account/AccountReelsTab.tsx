import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';
import { useRouter } from 'expo-router';
import { Reel } from '../../services/reels.service';
import { palette, radii, spacing } from '../../constants/tokens';
import { Play, Video, Plus, AlertCircle, RefreshCw } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const COLUMN_WIDTH = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export interface AccountReelsTabProps {
  reels: Reel[];
  isLoading: boolean;
  error?: unknown;
  onRefresh?: () => void;
}

export const AccountReelsTab: React.FC<AccountReelsTabProps> = ({
  reels,
  isLoading,
  error,
  onRefresh,
}) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#002f34" />
        <Text style={styles.stateText}>Loading your reels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={36} color={palette.danger500} style={{ marginBottom: 8 }} />
        <Text style={styles.stateTitle}>Could not load reels</Text>
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

  if (reels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Video size={44} color={palette.slate300} style={{ marginBottom: 8 }} />
        <Text style={styles.stateTitle}>No video reels yet</Text>
        <Text style={styles.stateText}>
          Record a 60-second video showcasing your items. Video listings receive 4x more buyer inquiries!
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/reel/create')}
        >
          <Plus size={16} color={palette.pureWhite} style={{ marginRight: 6 }} />
          <Text style={styles.ctaButtonText}>Create a Reel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {reels.map((item) => {
        const thumbUrl = item.customThumbnailUrl || item.thumbnailUrl;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.gridItem}
            activeOpacity={0.85}
            onPress={() => router.push(`/reel/${item.id}`)}
          >
            {thumbUrl ? (
              <ExpoImage
                source={{ uri: optimizeCloudinaryUrl(thumbUrl) }}
                style={styles.gridImage}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.placeholderBox}>
                <Video size={24} color={palette.slate400} />
              </View>
            )}

            {/* Play icon overlay */}
            <View style={styles.playOverlay}>
              <Play size={14} color={palette.pureWhite} fill={palette.pureWhite} />
            </View>

            {/* Optional views / likes pill */}
            {typeof item.viewsCount === 'number' && item.viewsCount > 0 && (
              <View style={styles.viewsOverlay}>
                <Text style={styles.viewsText}>{item.viewsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingTop: 2,
    paddingBottom: spacing.xl,
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.33,
    backgroundColor: palette.slate100,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.slate200,
  },
  playOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewsOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  viewsText: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.pureWhite,
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
