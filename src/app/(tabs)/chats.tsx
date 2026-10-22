import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { palette, radii, spacing } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { useConversationsQuery } from '../../hooks/useChat';
import { Conversation } from '../../services/chat.service';
import { formatRelativeTime } from '../../utils/formatters';

export default function ChatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'BUYING' | 'SELLING'>('BUYING');
  const [filterUnread, setFilterUnread] = useState(false);

  const { data: convData, isLoading, isRefetching, refetch } = useConversationsQuery();
  const allConversations = convData?.data || [];

  if (!isAuthenticated) {
    return (
      <ScreenContainer scrollable={false} hasBottomTab>
        <View style={styles.header}>
          <Text style={styles.title}>{t('chats.title', 'Chats')}</Text>
        </View>
        <EmptyState
          title="Sign in to view your chats"
          description="Connect with sellers and buyers directly once you log in to your account."
          actionTitle="Sign In"
          onActionPress={() => router.push('/(auth)/login')}
          icon={<Text style={styles.emptyIcon}>✉</Text>}
        />
      </ScreenContainer>
    );
  }

  // Filter conversations
  const filteredConversations = allConversations.filter((conv) => {
    // If filterUnread is on, check unreadCount for current user
    if (filterUnread) {
      const myPart = conv.participants?.find((p) => p.userId === user?.id);
      if (!myPart?.unreadCount) return false;
    }
    return true;
  });

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    // Find the other participant
    const otherParticipant = item.participants?.find((p) => p.userId !== user?.id);
    const myParticipant = item.participants?.find((p) => p.userId === user?.id);
    const unreadCount = myParticipant?.unreadCount || 0;

    const otherName = otherParticipant?.user?.name || 'User';

    return (
      <TouchableOpacity
        style={styles.convCard}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherName[0]?.toUpperCase() || '👤'}</Text>
        </View>

        <View style={styles.convContent}>
          <View style={styles.convHeaderRow}>
            <Text style={styles.participantName} numberOfLines={1}>
              {otherName}
            </Text>
            {item.lastMessageAt && (
              <Text style={styles.timeText}>{formatRelativeTime(item.lastMessageAt)}</Text>
            )}
          </View>

          {item.listing && (
            <View style={styles.listingTag}>
              <Text style={styles.listingTagText} numberOfLines={1}>
                🏷️ {item.listing.title}
              </Text>
            </View>
          )}

          <View style={styles.lastMessageRow}>
            <Text style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessageText || 'Tap to chat...'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false} hasBottomTab>
      <View style={styles.header}>
        <Text style={styles.title}>{t('chats.title', 'Chats')}</Text>
      </View>

      {/* Tabs Row: Buying vs Selling (OLX reference) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'BUYING' && styles.tabButtonActive]}
          onPress={() => setActiveTab('BUYING')}
        >
          <Text style={[styles.tabText, activeTab === 'BUYING' && styles.tabTextActive]}>
            BUYING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'SELLING' && styles.tabButtonActive]}
          onPress={() => setActiveTab('SELLING')}
        >
          <Text style={[styles.tabText, activeTab === 'SELLING' && styles.tabTextActive]}>
            SELLING
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.filterChip, !filterUnread && styles.filterChipActive]}
          onPress={() => setFilterUnread(false)}
        >
          <Text style={[styles.filterChipText, !filterUnread && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterUnread && styles.filterChipActive]}
          onPress={() => setFilterUnread(true)}
        >
          <Text style={[styles.filterChipText, filterUnread && styles.filterChipTextActive]}>Unread</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#002f34" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <EmptyState
          title={t('chats.emptyTitle', 'No conversations yet')}
          description={t(
            'chats.emptyDesc',
            'When you contact sellers on listings or buyers message you, your conversations will appear here.'
          )}
          actionTitle={t('chats.startExploring', 'Explore Marketplace')}
          onActionPress={() => router.push('/(tabs)')}
          icon={<Text style={styles.emptyIcon}>✉</Text>}
        />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#002f34']}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#002f34',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: palette.slate200,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#002f34',
    marginBottom: -2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate500,
  },
  tabTextActive: {
    color: '#002f34',
  },
  quickFilters: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: palette.pureWhite,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  filterChipActive: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate700,
  },
  filterChipTextActive: {
    color: palette.pureWhite,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.slate100,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.brand200,
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.brand600,
  },
  convContent: {
    flex: 1,
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate900,
    flex: 1,
    marginRight: spacing.sm,
  },
  timeText: {
    fontSize: 10,
    color: palette.slate400,
  },
  listingTag: {
    backgroundColor: palette.slate50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  listingTagText: {
    fontSize: 10,
    color: palette.slate600,
    fontWeight: '500',
    maxWidth: 200,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 13,
    color: palette.slate500,
    flex: 1,
  },
  lastMessageUnread: {
    color: palette.slate900,
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: spacing.xs,
  },
  unreadBadgeText: {
    color: palette.pureWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 48,
    color: palette.slate300,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: palette.slate500,
  },
});
