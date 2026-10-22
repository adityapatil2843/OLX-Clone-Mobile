import { useQuery, useMutation } from '@tanstack/react-query';
import { chatService, ChatMessage } from '../services/chat.service';
import { queryClient } from '../providers/QueryProvider';

export const CHAT_QUERY_KEYS = {
  all: ['conversations'] as const,
  list: (page?: number, limit?: number) => [...CHAT_QUERY_KEYS.all, 'list', page, limit] as const,
  detail: (id: string) => [...CHAT_QUERY_KEYS.all, 'detail', id] as const,
  messages: (id: string, cursor?: string) => [...CHAT_QUERY_KEYS.all, 'messages', id, cursor] as const,
};

export const useConversationsQuery = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.list(page, limit),
    queryFn: () => chatService.getConversations(page, limit),
  });
};

export const useConversationDetailQuery = (conversationId: string) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.detail(conversationId),
    queryFn: () => chatService.getConversationById(conversationId),
    enabled: Boolean(conversationId),
  });
};

export const useMessagesQuery = (conversationId: string, limit = 50, cursor?: string) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.messages(conversationId, cursor),
    queryFn: () => chatService.getMessages(conversationId, limit, cursor),
    enabled: Boolean(conversationId),
    refetchInterval: 5000, // Poll every 5s while in chat since socket.io is deferred
  });
};

export const useSendMessageMutation = (conversationId: string) => {
  return useMutation({
    mutationFn: (content: string) => chatService.sendMessage(conversationId, content),
    onSuccess: (newMessage: ChatMessage) => {
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.messages(conversationId),
        (old: { data: ChatMessage[]; meta?: { hasMore?: boolean; nextCursor?: string } } | undefined) => {
          if (!old) return { data: [newMessage] };
          return {
            ...old,
            data: [...old.data, newMessage],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.list() });
    },
  });
};

export const useCreateConversationMutation = () => {
  return useMutation({
    mutationFn: ({ recipientId, listingId }: { recipientId: string; listingId?: string | null }) =>
      chatService.getOrCreateConversation(recipientId, listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.all });
    },
  });
};
