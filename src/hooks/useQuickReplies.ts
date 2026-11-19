import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QuickReplyContext,
  getSuggestionsForContext,
} from '../constants/chatSuggestions';

export interface DisplayQuickReply {
  id: string;
  text: string;
}

export interface UseQuickRepliesOptions {
  /**
   * Current active conversation ID. Used to scope session dismissal state.
   */
  conversationId?: string | null;

  /**
   * Whether the conversation has an attached listing context or was navigated from a listing.
   */
  hasListingContext: boolean;

  /**
   * The current text in the message input field.
   */
  inputText: string;

  /**
   * Indicates if conversation details are currently loading.
   */
  isLoading?: boolean;

  /**
   * Indicates if conversation loading failed.
   */
  isError?: boolean;

  /**
   * Callback invoked when a suggestion chip is tapped.
   * Pre-fills the input field; must never trigger sending.
   */
  onSelectSuggestion: (text: string) => void;
}

export interface UseQuickRepliesResult {
  context: QuickReplyContext;
  suggestions: DisplayQuickReply[];
  isVisible: boolean;
  handleSelectSuggestion: (item: DisplayQuickReply) => void;
  dismiss: () => void;
}

/**
 * Hook to manage Quick Reply Suggestions state and visibility.
 * Implements context derivation, non-empty input suppression, local dismissal,
 * and conversation-switch lifecycle resets without triggering cascading renders.
 */
export function useQuickReplies({
  conversationId,
  hasListingContext,
  inputText,
  isLoading = false,
  isError = false,
  onSelectSuggestion,
}: UseQuickRepliesOptions): UseQuickRepliesResult {
  const { t } = useTranslation();

  // Store the conversationId for which quick replies have been dismissed.
  // This automatically resets dismissal when switching to a different conversationId.
  const [dismissedConversationId, setDismissedConversationId] = useState<string | null>(null);

  const isDismissed = Boolean(
    conversationId && dismissedConversationId === conversationId
  );

  // Derive context without assuming buyer/seller ownership
  const context: QuickReplyContext = useMemo(() => {
    return hasListingContext ? 'LISTING_INTEREST' : 'NEUTRAL';
  }, [hasListingContext]);

  // Translate and deduplicate suggestions
  const suggestions = useMemo<DisplayQuickReply[]>(() => {
    if (isLoading || isError) {
      return [];
    }

    const rawSuggestions = getSuggestionsForContext(context);
    const seenTexts = new Set<string>();
    const seenIds = new Set<string>();
    const result: DisplayQuickReply[] = [];

    for (const item of rawSuggestions) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);

      const translated = t(item.translationKey, item.defaultText);
      const trimmed = translated ? translated.trim() : '';
      if (!trimmed || seenTexts.has(trimmed)) continue;

      seenTexts.add(trimmed);
      result.push({
        id: item.id,
        text: trimmed,
      });
    }

    return result;
  }, [context, isLoading, isError, t]);

  const hasNonWhitespaceInput = inputText.trim().length > 0;

  // Visibility: Hidden when loading, error, dismissed, or input contains text
  const isVisible = useMemo(() => {
    if (isLoading || isError || isDismissed) return false;
    if (hasNonWhitespaceInput) return false;
    return suggestions.length > 0;
  }, [isLoading, isError, isDismissed, hasNonWhitespaceInput, suggestions.length]);

  const dismiss = useCallback(() => {
    if (conversationId) {
      setDismissedConversationId(conversationId);
    }
  }, [conversationId]);

  const handleSelectSuggestion = useCallback(
    (item: DisplayQuickReply) => {
      onSelectSuggestion(item.text);
    },
    [onSelectSuggestion]
  );

  return {
    context,
    suggestions,
    isVisible,
    handleSelectSuggestion,
    dismiss,
  };
}
