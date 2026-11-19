import axios from 'axios';
import { env } from '../config/env';
import { tokenStorage } from './token-storage';
import { useAuthStore } from '../stores/useAuthStore';
import { ApiError } from './api-error';

export class RefreshCoordinator {
  private inFlightRefreshPromise: Promise<string> | null = null;

  public async getFreshAccessToken(): Promise<string> {
    if (this.inFlightRefreshPromise) {
      return this.inFlightRefreshPromise;
    }

    this.inFlightRefreshPromise = (async () => {
      try {
        const storedRefreshToken = await tokenStorage.getRefreshToken();
        if (!storedRefreshToken) {
          throw new ApiError('No refresh token available', 401);
        }

        // Direct Axios invocation avoids interceptor recursion
        const response = await axios.post(`${env.API_BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        // Authoritative backend response structure: response.data.data.tokens
        const tokens = response.data?.data?.tokens;
        const newAccessToken = tokens?.accessToken;
        const newRefreshToken = tokens?.refreshToken;

        if (!newAccessToken || !newRefreshToken) {
          throw new ApiError('Failed to refresh authentication token', 401);
        }

        // Persist both rotated tokens
        await tokenStorage.saveTokens(newAccessToken, newRefreshToken);
        return newAccessToken;
      } catch (error) {
        await tokenStorage.clearTokens();
        useAuthStore.getState().clearSession();
        throw error;
      } finally {
        this.inFlightRefreshPromise = null;
      }
    })();

    return this.inFlightRefreshPromise;
  }

  public isInFlight(): boolean {
    return this.inFlightRefreshPromise !== null;
  }

  public resetForTest(): void {
    this.inFlightRefreshPromise = null;
  }
}

export const refreshCoordinator = new RefreshCoordinator();
