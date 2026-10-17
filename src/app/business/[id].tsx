import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '../../components/ui/PlaceholderScreen';

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title="Storefront"
      featureName={`Business Storefront #${id || 'Profile'}`}
      phase="Phase 2"
      description="Verified merchant storefronts, catalogue management, dealer inventory and customer reviews will be introduced in Phase 2."
    />
  );
}
