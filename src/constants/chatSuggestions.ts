export type QuickReplyContext = 'LISTING_INTEREST' | 'NEUTRAL';

export interface QuickReplySuggestion {
  id: string;
  translationKey: string;
  defaultText: string;
  context: QuickReplyContext;
}

/**
 * Declarative configuration for quick reply suggestions.
 * Uses neutral phrasing to allow user editing before dispatch.
 * Does not make definitive commitments regarding price, availability, or delivery.
 */
export const QUICK_REPLY_SUGGESTIONS: readonly QuickReplySuggestion[] = [
  // Listing-interest suggestions (when chat is associated with a listing)
  {
    id: 'listing_interest_item',
    translationKey: 'chats.quickReplies.interested',
    defaultText: "I'm interested in this item.",
    context: 'LISTING_INTEREST',
  },
  {
    id: 'listing_interest_available',
    translationKey: 'chats.quickReplies.isAvailable',
    defaultText: 'Is this still available?',
    context: 'LISTING_INTEREST',
  },
  {
    id: 'listing_interest_details',
    translationKey: 'chats.quickReplies.moreDetails',
    defaultText: 'Can you share more details?',
    context: 'LISTING_INTEREST',
  },
  {
    id: 'listing_interest_negotiable',
    translationKey: 'chats.quickReplies.priceNegotiable',
    defaultText: 'Is the price negotiable?',
    context: 'LISTING_INTEREST',
  },

  // Neutral suggestions (when no listing context is present)
  {
    id: 'neutral_hi',
    translationKey: 'chats.quickReplies.hi',
    defaultText: 'Hi',
    context: 'NEUTRAL',
  },
  {
    id: 'neutral_details',
    translationKey: 'chats.quickReplies.moreDetails',
    defaultText: 'Can you share more details?',
    context: 'NEUTRAL',
  },
  {
    id: 'neutral_discussion_time',
    translationKey: 'chats.quickReplies.discussionTime',
    defaultText: 'When would be a good time to discuss this?',
    context: 'NEUTRAL',
  },
] as const;

/**
 * Returns suggestions defined for the requested context.
 */
export function getSuggestionsForContext(
  context: QuickReplyContext
): readonly QuickReplySuggestion[] {
  return QUICK_REPLY_SUGGESTIONS.filter((item) => item.context === context);
}

