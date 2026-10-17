import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '../../components/ui/PlaceholderScreen';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title="Listing Details"
      featureName={`Listing #${id || 'Item'}`}
      phase="Phase 1"
      description="Full listing view with high-res photo gallery, seller trust badges, price negotiation and direct chat will be integrated in Phase 1."
    />
  );
}
