import '../src/i18n';
import {
  QUICK_REPLY_SUGGESTIONS,
  getSuggestionsForContext,
} from '../src/constants/chatSuggestions';
import { renderHook, act } from '@testing-library/react-native';
import { useQuickReplies, UseQuickRepliesResult } from '../src/hooks/useQuickReplies';
import en from '../src/i18n/resources/en.json';
import hi from '../src/i18n/resources/hi.json';
import mr from '../src/i18n/resources/mr.json';

describe('Quick Reply Suggestions', () => {
  describe('Constants Configuration', () => {
    it('has globally unique suggestion IDs', () => {
      const ids = QUICK_REPLY_SUGGESTIONS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('returns different suggestions for LISTING_INTEREST vs NEUTRAL', () => {
      const listingSuggestions = getSuggestionsForContext('LISTING_INTEREST');
      const neutralSuggestions = getSuggestionsForContext('NEUTRAL');

      expect(listingSuggestions.length).toBeGreaterThan(0);
      expect(neutralSuggestions.length).toBeGreaterThan(0);

      const listingIds = new Set(listingSuggestions.map((s) => s.id));
      const neutralIds = new Set(neutralSuggestions.map((s) => s.id));

      // No overlapping suggestion IDs across distinct contexts
      for (const id of listingIds) {
        expect(neutralIds.has(id)).toBe(false);
      }
    });

    it('has non-empty neutral phrasing that avoids guarantees', () => {
      for (const s of QUICK_REPLY_SUGGESTIONS) {
        expect(s.defaultText.trim().length).toBeGreaterThan(0);
        // Ensure neutral language avoiding commitments
        expect(s.defaultText.toLowerCase()).not.toContain('guarantee');
        expect(s.defaultText.toLowerCase()).not.toContain('warranty');
        expect(s.defaultText.toLowerCase()).not.toContain('payment confirmed');
      }
    });

    it('has all translation keys mapped across en, hi, mr', () => {
      const extractKey = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };

      for (const s of QUICK_REPLY_SUGGESTIONS) {
        expect(extractKey(en, s.translationKey)).toBeDefined();
        expect(extractKey(hi, s.translationKey)).toBeDefined();
        expect(extractKey(mr, s.translationKey)).toBeDefined();
      }
    });
  });

  describe('useQuickReplies Hook Logic', () => {
    it('determines context as LISTING_INTEREST when hasListingContext is true', async () => {
      const onSelect = jest.fn();
      const { result } = await renderHook(() =>
        useQuickReplies({
          conversationId: 'conv-1',
          hasListingContext: true,
          inputText: '',
          onSelectSuggestion: onSelect,
        })
      );

      expect(result.current.context).toBe('LISTING_INTEREST');
      expect(result.current.isVisible).toBe(true);
      expect(result.current.suggestions.length).toBeGreaterThan(0);
    });

    it('determines context as NEUTRAL when hasListingContext is false', async () => {
      const onSelect = jest.fn();
      const { result } = await renderHook(() =>
        useQuickReplies({
          conversationId: 'conv-2',
          hasListingContext: false,
          inputText: '',
          onSelectSuggestion: onSelect,
        })
      );

      expect(result.current.context).toBe('NEUTRAL');
      expect(result.current.isVisible).toBe(true);
      expect(result.current.suggestions.length).toBeGreaterThan(0);
    });

    it('hides suggestions when input contains non-whitespace text and restores when empty', async () => {
      const onSelect = jest.fn();
      const { result, rerender } = await renderHook<
        UseQuickRepliesResult,
        { text: string }
      >(
        ({ text }) =>
          useQuickReplies({
            conversationId: 'conv-1',
            hasListingContext: true,
            inputText: text,
            onSelectSuggestion: onSelect,
          }),
        {
          initialProps: { text: '' },
        }
      );

      expect(result.current.isVisible).toBe(true);

      // User types text
      await rerender({ text: 'Hello there' });
      expect(result.current.isVisible).toBe(false);

      // User clears text
      await rerender({ text: '' });
      expect(result.current.isVisible).toBe(true);

      // Whitespace-only should still be considered empty / not non-whitespace
      await rerender({ text: '   ' });
      expect(result.current.isVisible).toBe(true);
    });

    it('does not display suggestions while loading or in error state', async () => {
      const onSelect = jest.fn();
      const { result: loadingResult } = await renderHook(() =>
        useQuickReplies({
          conversationId: 'conv-1',
          hasListingContext: true,
          inputText: '',
          isLoading: true,
          onSelectSuggestion: onSelect,
        })
      );

      expect(loadingResult.current.isVisible).toBe(false);
      expect(loadingResult.current.suggestions).toEqual([]);

      const { result: errorResult } = await renderHook(() =>
        useQuickReplies({
          conversationId: 'conv-1',
          hasListingContext: true,
          inputText: '',
          isError: true,
          onSelectSuggestion: onSelect,
        })
      );

      expect(errorResult.current.isVisible).toBe(false);
      expect(errorResult.current.suggestions).toEqual([]);
    });

    it('supports local dismissal and resets when conversationId changes', async () => {
      const onSelect = jest.fn();
      const { result, rerender } = await renderHook<
        UseQuickRepliesResult,
        { convId: string }
      >(
        ({ convId }) =>
          useQuickReplies({
            conversationId: convId,
            hasListingContext: true,
            inputText: '',
            onSelectSuggestion: onSelect,
          }),
        {
          initialProps: { convId: 'conv-1' },
        }
      );

      expect(result.current.isVisible).toBe(true);

      // Dismiss in current conversation
      await act(async () => {
        result.current.dismiss();
      });
      expect(result.current.isVisible).toBe(false);

      // Switch conversation
      await rerender({ convId: 'conv-2' });
      expect(result.current.isVisible).toBe(true);
    });

    it('calls onSelectSuggestion when suggestion is selected without side-effects', async () => {
      const onSelect = jest.fn();
      const { result } = await renderHook(() =>
        useQuickReplies({
          conversationId: 'conv-1',
          hasListingContext: true,
          inputText: '',
          onSelectSuggestion: onSelect,
        })
      );

      const firstSuggestion = result.current.suggestions[0];
      expect(firstSuggestion).toBeDefined();

      await act(async () => {
        result.current.handleSelectSuggestion(firstSuggestion);
      });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(firstSuggestion.text);
    });
  });
});
