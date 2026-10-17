import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '../../components/ui/PlaceholderScreen';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title="User Profile"
      featureName={`Member Profile #${id || 'User'}`}
      phase="Phase 1"
      description="Public member profiles with seller rating, member since badge, active listings, and completed deals will be enabled in Phase 1."
    />
  );
}
