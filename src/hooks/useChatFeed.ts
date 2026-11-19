import { useState, useEffect, useRef, useCallback } from 'react';
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { chatService, ChatMessage } from '../services/chat.service';
import { queryClient } from '../providers/QueryProvider';
import { CHAT_QUERY_KEYS } from './useChat';

export interface UseChatFeedOptions {
  conversationId?: string | null;
  currentUserId?: string;
  pollingInterval?: number;
  pageSize?: number;
}

export interface UseChatFeedResult {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingOlder: boolean;
  isSending: boolean;
  hasMoreOlder: boolean;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<ChatMessage | null>;
  addOutgoingMessage: (message: ChatMessage) => void;
  flatListRef: React.RefObject<FlatList | null>;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  isNearBottom: boolean;
  scrollToBottom: (animated?: boolean) => void;
}

/**
 * Normalizes an array of messages into strict chronological order: oldest to newest.
 * Deduplicates by server ID.
 * Secondary sort by ID ensures deterministic order if timestamps are identical.
 */
export function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  const map = new Map<string, ChatMessage>();
  for (const msg of messages) {
    if (msg && msg.id) {
      map.set(msg.id, msg);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeA - timeB; // Ascending: oldest first (top), newest last (bottom)
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Merges incoming messages into an existing message array.
 * Deduplicates by server ID, retaining older messages and appending/updating newer messages.
 * Always returns items sorted in strict chronological order (oldest to newest).
 */
export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  const map = new Map<string, ChatMessage>();

  if (Array.isArray(current)) {
    for (const msg of current) {
      if (msg && msg.id) {
        map.set(msg.id, msg);
      }
    }
  }

  if (Array.isArray(incoming)) {
    for (const msg of incoming) {
      if (msg && msg.id) {
        // Incoming message updates existing (e.g. read status) or inserts new
        map.set(msg.id, msg);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeA - timeB;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Evaluates whether the current scroll position in a normal non-inverted FlatList
 * is near the bottom within the threshold.
 */
export function isNearBottom(
  layoutHeight: number,
  offsetY: number,
  contentHeight: number,
  threshold = 80
): boolean {
  if (contentHeight <= layoutHeight) {
    return true; // Entire content fits in viewport
  }
  return layoutHeight + offsetY >= contentHeight - threshold;
}

/**
 * Custom hook to manage the message feed lifecycle:
 * - Normalizes backend newest-first data into oldest-to-newest for non-inverted FlatList.
 * - Handles cursor-based pagination for older messages merged at the beginning.
 * - Manages polling refetches merged at the end without wiping or reordering older pages.
 * - Manages auto-scroll behavior strictly aligned to user intent.
 */
export function useChatFeed({
  conversationId,
  pollingInterval = 5000,
  pageSize = 30,
}: UseChatFeedOptions): UseChatFeedResult {
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(conversationId));
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isNearBottomState, setIsNearBottomState] = useState(true);

  // Reset state during render if conversationId prop changed (React recommended pattern)
  if (activeConversationId !== conversationId) {
    setActiveConversationId(conversationId);
    setMessages([]);
    setIsLoading(Boolean(conversationId));
    setHasMoreOlder(false);
  }

  const flatListRef = useRef<FlatList | null>(null);
  const oldestCursorRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);
  const isInitialScrollDoneRef = useRef(false);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const justSentMessageRef = useRef(false);

  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  // 1. Initial Load when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let isMounted = true;
    isInitialScrollDoneRef.current = false;
    prevLastMessageIdRef.current = null;
    oldestCursorRef.current = null;

    chatService
      .getMessages(conversationId, pageSize)
      .then((res) => {
        if (!isMounted) return;
        const normalized = normalizeMessages(res.data);
        setMessages(normalized);
        oldestCursorRef.current = res.meta?.nextCursor ?? null;
        setHasMoreOlder(Boolean(res.meta?.hasMore));
        setIsLoading(false);

        if (normalized.length > 0) {
          prevLastMessageIdRef.current = normalized[normalized.length - 1].id;
          requestAnimationFrame(() => {
            if (isMounted) {
              scrollToBottom(false);
              isInitialScrollDoneRef.current = true;
            }
          });
        } else {
          isInitialScrollDoneRef.current = true;
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
          isInitialScrollDoneRef.current = true;
        }
      });

    return () => {
      isMounted = false;
    };
  }, [conversationId, pageSize, scrollToBottom]);

  // 2. Periodic Polling for Latest Messages
  useEffect(() => {
    if (!conversationId || isLoading) return;

    const interval = setInterval(() => {
      chatService
        .getMessages(conversationId, pageSize)
        .then((res) => {
          if (!res.data || res.data.length === 0) return;

          setMessages((prev) => {
            const merged = mergeMessages(prev, res.data);
            if (!oldestCursorRef.current && res.meta?.nextCursor) {
              oldestCursorRef.current = res.meta.nextCursor;
              setHasMoreOlder(Boolean(res.meta.hasMore));
            }
            return merged;
          });
        })
        .catch(() => {
          // Keep current state on background poll network hiccup
        });
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [conversationId, isLoading, pageSize, pollingInterval]);

  // 3. Auto-scroll Handling on Message Updates
  useEffect(() => {
    if (messages.length === 0) return;

    const currentLastMessage = messages[messages.length - 1];
    const previousLastId = prevLastMessageIdRef.current;
    prevLastMessageIdRef.current = currentLastMessage.id;

    // Initial load auto-scroll
    if (!isInitialScrollDoneRef.current) {
      isInitialScrollDoneRef.current = true;
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
      return;
    }

    // A new message arrived at the end
    if (previousLastId && previousLastId !== currentLastMessage.id) {
      // Rule 1: Current user sent message
      if (justSentMessageRef.current) {
        justSentMessageRef.current = false;
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
        return;
      }

      // Rule 2: User is already near the bottom
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
        return;
      }

      // Rule 3: User is reading older messages -> DO NOT AUTO-SCROLL
    }
  }, [messages, scrollToBottom]);

  // 4. Load Older Messages (Pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || isLoadingOlder || !hasMoreOlder || !oldestCursorRef.current) {
      return;
    }

    setIsLoadingOlder(true);
    try {
      const res = await chatService.getMessages(
        conversationId,
        pageSize,
        oldestCursorRef.current
      );

      if (res.data && res.data.length > 0) {
        setMessages((prev) => mergeMessages(prev, res.data));
      }

      oldestCursorRef.current = res.meta?.nextCursor ?? null;
      setHasMoreOlder(Boolean(res.meta?.hasMore));
    } catch {
      // Maintain current state on error
    } finally {
      setIsLoadingOlder(false);
    }
  }, [conversationId, hasMoreOlder, isLoadingOlder, pageSize]);

  // 5. Send Message
  const sendMessage = useCallback(
    async (content: string): Promise<ChatMessage | null> => {
      if (!conversationId || !content.trim()) return null;

      setIsSending(true);
      justSentMessageRef.current = true;
      isNearBottomRef.current = true;

      try {
        const sentMessage = await chatService.sendMessage(conversationId, content);
        setMessages((prev) => mergeMessages(prev, [sentMessage]));
        queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.list() });
        return sentMessage;
      } catch (err) {
        justSentMessageRef.current = false;
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  // 6. Ingest Outgoing Message (e.g. Image upload from attachments)
  const addOutgoingMessage = useCallback((message: ChatMessage) => {
    justSentMessageRef.current = true;
    isNearBottomRef.current = true;
    setMessages((prev) => mergeMessages(prev, [message]));
    queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.list() });
  }, []);

  // 7. Scroll Listener
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const isNear = isNearBottom(
        layoutMeasurement.height,
        contentOffset.y,
        contentSize.height,
        80
      );
      isNearBottomRef.current = isNear;
      setIsNearBottomState(isNear);

      // Auto-fetch older messages when scrolling close to top
      if (contentOffset.y <= 30 && hasMoreOlder && !isLoadingOlder && !isLoading) {
        loadOlderMessages();
      }
    },
    [hasMoreOlder, isLoading, isLoadingOlder, loadOlderMessages]
  );

  return {
    messages,
    isLoading,
    isLoadingOlder,
    isSending,
    hasMoreOlder,
    loadOlderMessages,
    sendMessage,
    addOutgoingMessage,
    flatListRef,
    handleScroll,
    isNearBottom: isNearBottomState,
    scrollToBottom,
  };
}
