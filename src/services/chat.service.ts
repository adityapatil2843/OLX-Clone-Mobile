import { apiClient } from './api-client';

export interface ChatParticipant {
  id: string;
  userId: string;
  unreadCount?: number;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    isVerifiedSeller?: boolean;
  };
}

export interface ConversationListing {
  id: string;
  title: string;
  price: number;
  currency?: string;
  status?: string;
}

export interface Conversation {
  id: string;
  listingId?: string | null;
  listing?: ConversationListing | null;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface ConversationsApiResponse {
  success: boolean;
  data: Conversation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const chatService = {
  getConversations: async (page = 1, limit = 20): Promise<{ data: Conversation[]; meta: ConversationsApiResponse['meta'] }> => {
    const res = await apiClient.get<ConversationsApiResponse>(`/conversations?page=${page}&limit=${limit}`);
    return { data: res.data, meta: res.meta };
  },

  getOrCreateConversation: async (recipientId: string, listingId?: string | null): Promise<Conversation> => {
    const res = await apiClient.post<{ success: boolean; data: Conversation }>('/conversations', {
      recipientId,
      listingId: listingId || null,
    });
    return res.data;
  },

  getConversationById: async (conversationId: string): Promise<Conversation> => {
    const res = await apiClient.get<{ success: boolean; data: Conversation }>(`/conversations/${conversationId}`);
    return res.data;
  },

  getMessages: async (conversationId: string, limit = 50, cursor?: string): Promise<{ data: ChatMessage[]; meta?: { hasMore?: boolean; nextCursor?: string } }> => {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (cursor) params.append('cursor', cursor);

    const res = await apiClient.get<{ success: boolean; data: ChatMessage[]; meta?: { hasMore?: boolean; nextCursor?: string } }>(
      `/conversations/${conversationId}/messages?${params.toString()}`
    );
    return { data: res.data, meta: res.meta };
  },

  sendMessage: async (conversationId: string, content: string): Promise<ChatMessage> => {
    const res = await apiClient.post<{ success: boolean; data: ChatMessage }>(
      `/conversations/${conversationId}/messages`,
      { content, type: 'TEXT' }
    );
    return res.data;
  },
};
