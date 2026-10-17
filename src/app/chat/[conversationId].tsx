import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '../../components/ui/PlaceholderScreen';

export default function ChatConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  return (
    <PlaceholderScreen
      title="Conversation"
      featureName={`Chat #${conversationId || 'Thread'}`}
      phase="Phase 1"
      description="Real-time buyer-seller chat with Socket.IO, photo sharing, price negotiation and system notifications will be integrated in Phase 1."
    />
  );
}
