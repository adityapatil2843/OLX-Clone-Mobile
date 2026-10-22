import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing } from '../../constants/tokens';
import { useReelDetailQuery } from '../../hooks/useReels';
import { useVideoPlayer, VideoView } from 'expo-video';
import { formatCurrencyINR } from '../../utils/formatters';

export default function SingleReelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: reel, isLoading, error } = useReelDetailQuery(id || '');

  const player = useVideoPlayer(reel?.videoUrl || null, (p) => {
    p.loop = true;
    p.play();
  });

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
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reel.videoUrl && player ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>📹</Text>
          <Text style={{ color: palette.slate400 }}>No video preview available</Text>
        </View>
      )}

      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBack, { top: Math.max(insets.top, 12) }]}
        onPress={() => router.back()}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Bottom Overlay */}
      <View style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text style={styles.title}>{reel.title}</Text>
        {reel.description && <Text style={styles.desc}>{reel.description}</Text>}

        {reel.listing && (
          <TouchableOpacity
            style={styles.listingBtn}
            onPress={() => router.push(`/listing/${reel.listing?.id}`)}
          >
            <Text style={styles.listingBtnText}>
              View Listing • {formatCurrencyINR(reel.listing.price)} ›
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  backIcon: {
    color: palette.pureWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  listingBtn: {
    marginTop: spacing.md,
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
});
