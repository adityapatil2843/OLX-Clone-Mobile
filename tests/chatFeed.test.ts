import {
  normalizeMessages,
  mergeMessages,
  isNearBottom,
} from '../src/hooks/useChatFeed';
import { ChatMessage } from '../src/services/chat.service';

describe('Chat Message Feed Normalization & Pagination', () => {
  const createMockMessage = (
    id: string,
    createdAt: string,
    content: string,
    type: 'TEXT' | 'IMAGE' = 'TEXT',
    senderId = 'user-1'
  ): ChatMessage => ({
    id,
    conversationId: 'conv-test',
    senderId,
    content,
    type,
    isRead: false,
    createdAt,
  });

  describe('1. Initial Messages (API returns newest-first)', () => {
    it('normalizes newest-first API response into oldest-to-newest order', () => {
      // Backend API returns newest message at index 0 (orderBy: { createdAt: 'desc' })
      const serverBatch: ChatMessage[] = [
        createMockMessage('msg-3', '2026-10-31T10:02:00.000Z', 'Third (newest)'),
        createMockMessage('msg-2', '2026-10-31T10:01:00.000Z', 'Second'),
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'First (oldest)'),
      ];

      const normalized = normalizeMessages(serverBatch);

      expect(normalized).toHaveLength(3);
      expect(normalized[0].id).toBe('msg-1');
      expect(normalized[1].id).toBe('msg-2');
      expect(normalized[2].id).toBe('msg-3');
      expect(normalized[0].content).toBe('First (oldest)');
      expect(normalized[2].content).toBe('Third (newest)');
    });
  });

  describe('2. Incoming Messages from Polling', () => {
    it('appends incoming polling messages at the end without duplicating existing ones', () => {
      const currentMessages: ChatMessage[] = [
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'One'),
        createMockMessage('msg-2', '2026-10-31T10:01:00.000Z', 'Two'),
      ];

      // Polling returns a batch containing existing messages plus a new incoming message
      const pollResponse: ChatMessage[] = [
        createMockMessage('msg-3', '2026-10-31T10:02:00.000Z', 'Three (new incoming)'),
        createMockMessage('msg-2', '2026-10-31T10:01:00.000Z', 'Two'),
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'One'),
      ];

      const merged = mergeMessages(currentMessages, pollResponse);

      expect(merged).toHaveLength(3);
      expect(merged.map((m) => m.id)).toEqual(['msg-1', 'msg-2', 'msg-3']);
      expect(merged[2].id).toBe('msg-3');
    });

    it('retains older paginated messages when polling only returns the latest window', () => {
      // User previously loaded older messages msg-old-1 and msg-old-2
      const currentMessages: ChatMessage[] = [
        createMockMessage('msg-old-2', '2026-10-31T09:58:00.000Z', 'Old 2'),
        createMockMessage('msg-old-1', '2026-10-31T09:59:00.000Z', 'Old 1'),
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'One'),
        createMockMessage('msg-2', '2026-10-31T10:01:00.000Z', 'Two'),
      ];

      // Background poll only returns latest 2 messages (older ones are outside window)
      const latestWindow: ChatMessage[] = [
        createMockMessage('msg-3', '2026-10-31T10:02:00.000Z', 'Three'),
        createMockMessage('msg-2', '2026-10-31T10:01:00.000Z', 'Two'),
      ];

      const merged = mergeMessages(currentMessages, latestWindow);

      expect(merged).toHaveLength(5);
      // Older messages are NOT wiped out
      expect(merged[0].id).toBe('msg-old-2');
      expect(merged[1].id).toBe('msg-old-1');
      expect(merged[4].id).toBe('msg-3');
    });
  });

  describe('3. Outgoing Messages', () => {
    it('merges new outgoing message at the end of the feed', () => {
      const currentMessages: ChatMessage[] = [
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'Hello'),
      ];

      const outgoingMessage = createMockMessage(
        'msg-2',
        '2026-10-31T10:01:00.000Z',
        'Sent message from current user',
        'TEXT',
        'current-user-id'
      );

      const merged = mergeMessages(currentMessages, [outgoingMessage]);

      expect(merged).toHaveLength(2);
      expect(merged[1].id).toBe('msg-2');
      expect(merged[1].senderId).toBe('current-user-id');
    });
  });

  describe('4. Rapid Consecutive Messages', () => {
    it('maintains deterministic ordering by ID when timestamps are identical', () => {
      const rapid1 = createMockMessage('msg-b', '2026-10-31T10:00:00.000Z', 'Rapid B');
      const rapid2 = createMockMessage('msg-a', '2026-10-31T10:00:00.000Z', 'Rapid A');

      const merged = mergeMessages([], [rapid1, rapid2]);

      expect(merged).toHaveLength(2);
      expect(merged[0].id).toBe('msg-a');
      expect(merged[1].id).toBe('msg-b');
    });
  });

  describe('5. Duplicate Polling Responses', () => {
    it('idempotently deduplicates identical polling responses without reordering', () => {
      const initial: ChatMessage[] = [
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'Msg 1'),
        createMockMessage('msg-2', '2026-10-31T10:01:00.000Z', 'Msg 2'),
      ];

      // Second poll returns identical messages
      const duplicateBatch: ChatMessage[] = [
        createMockMessage('msg-2', '2026-10-31T10:01:00.000Z', 'Msg 2'),
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'Msg 1'),
      ];

      const merged = mergeMessages(initial, duplicateBatch);

      expect(merged).toHaveLength(2);
      expect(merged.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
    });
  });

  describe('6. Older-Message Pagination', () => {
    it('merges older paginated results at the beginning of the list', () => {
      const currentMessages: ChatMessage[] = [
        createMockMessage('msg-10', '2026-10-31T10:10:00.000Z', 'Msg 10'),
        createMockMessage('msg-11', '2026-10-31T10:11:00.000Z', 'Msg 11'),
      ];

      // Older page fetched from server (newest-first in response)
      const olderPage: ChatMessage[] = [
        createMockMessage('msg-9', '2026-10-31T10:09:00.000Z', 'Msg 9'),
        createMockMessage('msg-8', '2026-10-31T10:08:00.000Z', 'Msg 8'),
      ];

      const merged = mergeMessages(currentMessages, olderPage);

      expect(merged).toHaveLength(4);
      expect(merged[0].id).toBe('msg-8');
      expect(merged[1].id).toBe('msg-9');
      expect(merged[2].id).toBe('msg-10');
      expect(merged[3].id).toBe('msg-11');
    });
  });

  describe('7. Image Messages', () => {
    it('preserves image message type and content URL in normalized feed', () => {
      const messages: ChatMessage[] = [
        createMockMessage('msg-1', '2026-10-31T10:00:00.000Z', 'Here is the item picture'),
        createMockMessage(
          'msg-2',
          '2026-10-31T10:01:00.000Z',
          'https://res.cloudinary.com/test/image/upload/sample.jpg',
          'IMAGE'
        ),
      ];

      const normalized = normalizeMessages(messages);

      expect(normalized).toHaveLength(2);
      expect(normalized[1].type).toBe('IMAGE');
      expect(normalized[1].content).toContain('cloudinary.com');
    });
  });

  describe('8. User Reading Older Messages while New Message Arrives', () => {
    it('correctly identifies when user is near bottom vs reading older messages', () => {
      const layoutHeight = 600;
      const contentHeight = 3000;

      // Case A: User scrolled to the bottom (offsetY = 2400)
      // 600 + 2400 = 3000 >= 3000 - 80 => Near bottom (True)
      expect(isNearBottom(layoutHeight, 2400, contentHeight)).toBe(true);

      // Case B: User is within 50px of bottom (offsetY = 2350)
      // 600 + 2350 = 2950 >= 2920 => Near bottom (True)
      expect(isNearBottom(layoutHeight, 2350, contentHeight)).toBe(true);

      // Case C: User is reading older messages scrolled up (offsetY = 500)
      // 600 + 500 = 1100 < 2920 => NOT near bottom (False)
      expect(isNearBottom(layoutHeight, 500, contentHeight)).toBe(false);

      // Case D: Content is short and fits on screen
      expect(isNearBottom(600, 0, 400)).toBe(true);
    });
  });
});

