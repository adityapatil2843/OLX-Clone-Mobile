import { apiClient, ApiError } from '../src/services/api-client';
import { tokenStorage } from '../src/services/token-storage';
import { authService } from '../src/services/auth.service';
import { listingsService } from '../src/services/listings.service';
import { reelsService } from '../src/services/reels.service';
import { wishlistService } from '../src/services/wishlist.service';
import { chatService } from '../src/services/chat.service';
import { useAuthStore } from '../src/stores/useAuthStore';

const mockStore: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItemAsync: jest.fn((key: string, val: string) => {
    mockStore[key] = val;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
}));

describe('API Integration & Service Contracts', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    jest.clearAllMocks();
  });

  describe('ApiError Normalization', () => {
    it('constructs an ApiError with status, code, and details', () => {
      const err = new ApiError('Validation failed', 422, 'VALIDATION_ERROR', { field: 'email' });
      expect(err.message).toBe('Validation failed');
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toEqual({ field: 'email' });
    });
  });

  describe('Token Storage Operations', () => {
    it('manages in-memory and secure tokens correctly', async () => {
      await tokenStorage.saveTokens('test_access_token', 'test_refresh_token');
      const token = await tokenStorage.getAccessToken();
      expect(token).toBe('test_access_token');

      const refresh = await tokenStorage.getRefreshToken();
      expect(refresh).toBe('test_refresh_token');

      await tokenStorage.clearTokens();
      const clearedToken = await tokenStorage.getAccessToken();
      expect(clearedToken).toBeNull();
    });
  });

  describe('Authentication Service', () => {
    it('updates auth store session and stores tokens on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test Buyer',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date().toISOString(),
      };
      const mockTokens = {
        accessToken: 'access_abc',
        refreshToken: 'refresh_xyz',
      };

      jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, tokens: mockTokens },
      });

      const user = await authService.login({ email: 'test@example.com', password: 'password123' });
      expect(user.id).toBe('user-123');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('Test Buyer');
    });

    it('clears credentials and store state on logout', async () => {
      useAuthStore.getState().setSession({
        id: 'user-123',
        role: 'USER',
        createdAt: new Date().toISOString(),
      });
      jest.spyOn(apiClient, 'post').mockResolvedValueOnce({ success: true, data: {} });

      await authService.logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('Listings Service Contract', () => {
    it('constructs correct query parameters for public listings search', async () => {
      const mockGet = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        success: true,
        data: [{ id: 'listing-1', title: 'Honda City', price: 500000 }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await listingsService.getListings({
        search: 'Honda',
        city: 'Mumbai',
        minPrice: 100000,
        maxPrice: 800000,
        page: 1,
        limit: 10,
      });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/listings?search=Honda&minPrice=100000&maxPrice=800000&city=Mumbai&page=1&limit=10')
      );
      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('Honda City');
    });
  });

  describe('Reels Service Contract', () => {
    it('calls like and unlike endpoints correctly', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({ success: true });
      const mockDelete = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce({ success: true });

      await reelsService.likeReel('reel-456');
      expect(mockPost).toHaveBeenCalledWith('/reels/reel-456/like');

      await reelsService.unlikeReel('reel-456');
      expect(mockDelete).toHaveBeenCalledWith('/reels/reel-456/like');
    });

    it('adds and lists comments correctly', async () => {
      const mockComment = {
        id: 'c-1',
        text: 'Great condition!',
        createdAt: new Date().toISOString(),
        user: { id: 'u-1', name: 'Buyer' },
      };

      jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        data: mockComment,
      });

      const comment = await reelsService.addComment('reel-456', 'Great condition!');
      expect(comment.text).toBe('Great condition!');
    });
  });

  describe('Chat Service Contract', () => {
    it('calls getOrCreateConversation with recipientId and listingId', async () => {
      const mockConv = {
        id: 'conv-999',
        listingId: 'listing-1',
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        data: mockConv,
      });

      const conv = await chatService.getOrCreateConversation('seller-123', 'listing-1');
      expect(mockPost).toHaveBeenCalledWith('/conversations', {
        recipientId: 'seller-123',
        listingId: 'listing-1',
      });
      expect(conv.id).toBe('conv-999');
    });

    it('sends a chat message to a conversation', async () => {
      const mockMsg = {
        id: 'msg-1',
        conversationId: 'conv-999',
        senderId: 'user-123',
        content: 'Is this negotiable?',
        type: 'TEXT',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        data: mockMsg,
      });

      const msg = await chatService.sendMessage('conv-999', 'Is this negotiable?');
      expect(mockPost).toHaveBeenCalledWith('/conversations/conv-999/messages', {
        content: 'Is this negotiable?',
        type: 'TEXT',
      });
      expect(msg.content).toBe('Is this negotiable?');
    });
  });

  describe('Wishlist Service Contract', () => {
    it('adds and removes items from wishlist', async () => {
      const mockPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        data: { id: 'w-1', listingId: 'listing-1' },
      });
      const mockDelete = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        success: true,
        data: { message: 'Removed' },
      });

      await wishlistService.addToWishlist('listing-1');
      expect(mockPost).toHaveBeenCalledWith('/wishlist/listing-1');

      await wishlistService.removeFromWishlist('listing-1');
      expect(mockDelete).toHaveBeenCalledWith('/wishlist/listing-1');
    });
  });
});
