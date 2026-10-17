import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '../../components/ui/PlaceholderScreen';

export default function ReelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title="Video Reel"
      featureName={`Reel #${id || 'Feed'}`}
      phase="Phase 1"
      description="Full-screen vertical reel player with like, share, and seller contact interactions will connect to the video streaming CDN in Phase 1."
    />
  );
}
