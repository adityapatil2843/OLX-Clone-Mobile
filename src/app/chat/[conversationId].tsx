import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  useConversationDetailQuery,
  useMessagesQuery,
  useSendMessageMutation,
} from '../../hooks/useChat';
import { ChatMessage } from '../../services/chat.service';
import { formatCurrencyINR, formatRelativeTime } from '../../utils/formatters';

export default function ChatConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation, isLoading: isConvLoading } = useConversationDetailQuery(conversationId || '');
  const { data: messagesData, isLoading: isMessagesLoading } = useMessagesQuery(conversationId || '');
  const sendMessageMutation = useSendMessageMutation(conversationId || '');

  const messages = messagesData?.data || [];

  const otherParticipant = conversation?.participants?.find((p) => p.userId !== user?.id);
  const otherName = otherParticipant?.user?.name || 'Seller / Buyer';

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    sendMessageMutation.mutate(text, {
      onSuccess: () => {
        flatListRef.current?.scrollToEnd({ animated: true });
      },
    });
  };

  const renderMessageBubble = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === user?.id;

    return (
      <View style={[styles.bubbleRow, isMine ? styles.myBubbleRow : styles.theirBubbleRow]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.theirTimeText]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{otherName[0]?.toUpperCase() || '👤'}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={styles.headerSubtext}>Active in Marketplace</Text>
        </View>
      </View>

      {/* Linked Listing Header Banner (if linked to an item) */}
      {conversation?.listing && (
        <TouchableOpacity
          style={styles.listingBanner}
          onPress={() => router.push(`/listing/${conversation.listing?.id}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.listingIcon}>🏷️</Text>
          <View style={styles.listingBannerContent}>
            <Text style={styles.listingBannerTitle} numberOfLines={1}>
              {conversation.listing.title}
            </Text>
            <Text style={styles.listingBannerPrice}>
              {formatCurrencyINR(conversation.listing.price)}
            </Text>
          </View>
          <Text style={styles.viewAdLink}>View Ad ›</Text>
        </TouchableOpacity>
      )}

      {/* Messages Thread */}
      {isConvLoading || isMessagesLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#002f34" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Say Hello!</Text>
          <Text style={styles.emptySubtitle}>
            Send a message to ask about condition, negotiate pricing, or schedule a pickup.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageBubble}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={palette.slate400}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sendMessageMutation.isPending}
          activeOpacity={0.8}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color={palette.pureWhite} />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#002f34',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.brand200,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.brand600,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate900,
  },
  headerSubtext: {
    fontSize: 11,
    color: palette.slate500,
  },
  listingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
    gap: spacing.sm,
  },
  listingIcon: {
    fontSize: 18,
  },
  listingBannerContent: {
    flex: 1,
  },
  listingBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate800,
  },
  listingBannerPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002f34',
  },
  viewAdLink: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.brand600,
  },
  messagesList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  myBubbleRow: {
    justifyContent: 'flex-end',
  },
  theirBubbleRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  myBubble: {
    backgroundColor: '#002f34',
    borderBottomRightRadius: radii.xs,
  },
  theirBubble: {
    backgroundColor: palette.pureWhite,
    borderBottomLeftRadius: radii.xs,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: palette.pureWhite,
  },
  theirMessageText: {
    color: palette.slate800,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimeText: {
    color: palette.slate400,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderTopWidth: 1,
    borderTopColor: palette.slate200,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: palette.slate100,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    color: palette.slate800,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: palette.pureWhite,
    fontSize: 16,
    marginLeft: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: palette.slate500,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
  },
});
