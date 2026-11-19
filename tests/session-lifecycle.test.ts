import axios from 'axios';
import { tokenStorage } from '../src/services/token-storage';
import { refreshCoordinator } from '../src/services/refresh-coordinator';
import { apiClient, refreshAccessToken, ApiError } from '../src/services/api-client';
import { authService } from '../src/services/auth.service';
import { useAuthStore } from '../src/stores/useAuthStore';
import { env } from '../src/config/env';

// ── In-Memory SecureStore Mock ──────────────────────────────────
const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, val: string) => {
    mockStore.set(key, String(val));
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

describe('Authentication Session Lifecycle & Refresh Coordinator', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockStore.clear();
    await tokenStorage.clearTokens();
    useAuthStore.getState().clearSession();
    refreshCoordinator.resetForTest();
  });

  describe('A. Refresh response parsing & Rotated Token Persistence', () => {
    it('correctly parses data.tokens from backend response and persists rotated tokens', async () => {
      // Seed initial tokens
      await tokenStorage.saveTokens('initial-access-token', 'initial-refresh-token');

      // Mock backend response with exact structure: { success: true, data: { tokens: { accessToken, refreshToken } } }
      const mockPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            tokens: {
              accessToken: 'rotated-access-token-123',
              refreshToken: 'rotated-refresh-token-456',
              tokenType: 'Bearer',
              expiresIn: '15m',
            },
          },
        },
      });

      const newAccessToken = await refreshCoordinator.getFreshAccessToken();

      expect(newAccessToken).toBe('rotated-access-token-123');
      expect(mockPost).toHaveBeenCalledWith(
        `${env.API_BASE_URL}/auth/refresh`,
        { refreshToken: 'initial-refresh-token' }
      );

      // Verify both rotated tokens were persisted in storage
      const storedAccess = await tokenStorage.getAccessToken();
      const storedRefresh = await tokenStorage.getRefreshToken();
      expect(storedAccess).toBe('rotated-access-token-123');
      expect(storedRefresh).toBe('rotated-refresh-token-456');
    });

    it('rejects if response shape does not contain valid data.tokens', async () => {
      await tokenStorage.saveTokens('access-token', 'refresh-token');

      // Malformed backend response without data.tokens
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {},
        },
      });

      await expect(refreshCoordinator.getFreshAccessToken()).rejects.toThrow(
        /Failed to refresh authentication token/i
      );

      // Verify tokens were cleared upon refresh failure
      expect(await tokenStorage.getAccessToken()).toBeNull();
      expect(await tokenStorage.getRefreshToken()).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('B. Single-Flight Concurrency Control', () => {
    it('executes exactly ONE refresh network request for concurrent refresh calls', async () => {
      await tokenStorage.saveTokens('old-access', 'valid-refresh');

      let resolveNetworkCall!: (val: any) => void;
      const delayedNetworkPromise = new Promise((resolve) => {
        resolveNetworkCall = resolve;
      });

      const postSpy = jest.spyOn(axios, 'post').mockReturnValueOnce(delayedNetworkPromise as any);

      // Trigger 3 concurrent refresh calls simultaneously
      const call1 = refreshCoordinator.getFreshAccessToken();
      const call2 = refreshCoordinator.getFreshAccessToken();
      const call3 = refreshCoordinator.getFreshAccessToken();

      expect(refreshCoordinator.isInFlight()).toBe(true);

      // Resolve the single network call
      resolveNetworkCall({
        status: 200,
        data: {
          success: true,
          data: {
            tokens: {
              accessToken: 'concurrent-access-token',
              refreshToken: 'concurrent-refresh-token',
            },
          },
        },
      });

      const [res1, res2, res3] = await Promise.all([call1, call2, call3]);

      // All 3 callers must receive the identical fresh token
      expect(res1).toBe('concurrent-access-token');
      expect(res2).toBe('concurrent-access-token');
      expect(res3).toBe('concurrent-access-token');

      // But axios.post must have been invoked exactly ONCE
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(refreshCoordinator.isInFlight()).toBe(false);
    });

    it('rejects all concurrent queued callers when refresh fails', async () => {
      await tokenStorage.saveTokens('old-access', 'revoked-refresh');

      let rejectNetworkCall!: (err: any) => void;
      const delayedNetworkPromise = new Promise((_, reject) => {
        rejectNetworkCall = reject;
      });

      jest.spyOn(axios, 'post').mockReturnValueOnce(delayedNetworkPromise as any);

      const call1 = refreshCoordinator.getFreshAccessToken();
      const call2 = refreshCoordinator.getFreshAccessToken();

      rejectNetworkCall(new Error('Refresh token revoked'));

      await expect(call1).rejects.toThrow('Refresh token revoked');
      await expect(call2).rejects.toThrow('Refresh token revoked');

      expect(await tokenStorage.getAccessToken()).toBeNull();
      expect(await tokenStorage.getRefreshToken()).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('C. Session Restoration (App Startup)', () => {
    it('restores session when access token is missing but refresh token exists', async () => {
      // Access token is missing, but valid refresh token is present in storage
      await tokenStorage.saveTokens('', 'persisted-refresh-token');
      // Ensure access token is null/empty
      mockStore.delete('mandi_access_token');

      // Mock coordinator refresh endpoint
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            tokens: {
              accessToken: 'restored-access-token',
              refreshToken: 'restored-refresh-token',
            },
          },
        },
      });

      // Mock /auth/me profile call
      const dummyUser = { id: 'usr-restore', email: 'restore@example.com', name: 'Restore User', role: 'USER' };
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        success: true,
        data: dummyUser,
      } as any);

      const user = await authService.getCurrentUser();

      expect(user).toBeTruthy();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.id).toBe('usr-restore');
      expect(getSpy).toHaveBeenCalledWith('/auth/me');
    });

    it('remains unauthenticated when neither token exists', async () => {
      await tokenStorage.clearTokens();

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears state and sets loading false when restore session refresh fails', async () => {
      await tokenStorage.saveTokens('', 'expired-refresh-token');
      mockStore.delete('mandi_access_token');

      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Token expired'));

      await authService.initAuth();

      expect(await tokenStorage.getAccessToken()).toBeNull();
      expect(await tokenStorage.getRefreshToken()).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('D. 401 Interceptor, Retry & Recursion Safety', () => {
    it('does not retry authentication routes when they receive 401', async () => {
      const coordinatorSpy = jest.spyOn(refreshCoordinator, 'getFreshAccessToken');

      const rawClient = apiClient.getRawClient();
      const authRoutes = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/logout'];

      for (const route of authRoutes) {
        try {
          // Trigger mock 401 on auth route
          const error: any = new Error('Unauthorized');
          error.response = { status: 401, data: { message: 'Invalid credentials' } };
          error.config = { url: route, headers: {} };

          // Execute response error interceptor directly
          const interceptor = (rawClient.interceptors.response as any).handlers[0].rejected;
          await interceptor(error);
        } catch (e: any) {
          expect(e.statusCode).toBe(401);
        }
      }

      // Refresh coordinator must never have been called for auth routes
      expect(coordinatorSpy).not.toHaveBeenCalled();
    });

    it('prevents infinite retry loop by respecting _retry flag', async () => {
      const coordinatorSpy = jest.spyOn(refreshCoordinator, 'getFreshAccessToken');

      const rawClient = apiClient.getRawClient();
      const error: any = new Error('Unauthorized');
      error.response = { status: 401, data: { message: 'Expired' } };
      // Request already has _retry = true
      error.config = { url: '/listings/my-listings', headers: {}, _retry: true };

      const interceptor = (rawClient.interceptors.response as any).handlers[0].rejected;

      await expect(interceptor(error)).rejects.toThrow();
      expect(coordinatorSpy).not.toHaveBeenCalled();
    });
  });
});
