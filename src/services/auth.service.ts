import { apiClient } from './api-client';
import { tokenStorage } from './token-storage';
import { UserProfile, AuthTokens } from '../types/user';
import { useAuthStore } from '../stores/useAuthStore';
import { logger } from '../utils/logger';

export class NotImplementedError extends Error {
  constructor(featureName: string) {
    super(`[Not Implemented] ${featureName} is not supported by the backend.`);
    this.name = 'NotImplementedError';
  }
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
  locationCity?: string;
  locationState?: string;
}

export interface RequestOtpParams {
  email?: string;
  phone?: string;
  purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
}

export interface VerifyOtpParams {
  email?: string;
  phone?: string;
  otp: string;
  purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
}

export interface AuthApiResponse {
  success: boolean;
  data: {
    user: UserProfile;
    tokens: AuthTokens;
  };
}

export interface VerifyOtpApiResponse {
  success: boolean;
  data: {
    message: string;
    verified: boolean;
    email?: string;
    user?: UserProfile;
    tokens?: AuthTokens;
  };
}

export const authService = {
  login: async (params: LoginParams): Promise<UserProfile> => {
    const res = await apiClient.post<AuthApiResponse>('/auth/login', {
      email: params.email.trim().toLowerCase(),
      password: params.password,
    });

    const { user, tokens } = res.data;
    if (tokens?.accessToken) {
      await tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
    }
    useAuthStore.getState().setSession(user);
    return user;
  },

  register: async (params: RegisterParams): Promise<UserProfile> => {
    const res = await apiClient.post<AuthApiResponse>('/auth/register', {
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      password: params.password,
      ...(params.phone ? { phone: params.phone.trim() } : {}),
      ...(params.locationCity ? { locationCity: params.locationCity.trim() } : {}),
      ...(params.locationState ? { locationState: params.locationState.trim() } : {}),
    });

    const { user, tokens } = res.data;
    if (tokens?.accessToken) {
      await tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
    }
    useAuthStore.getState().setSession(user);
    return user;
  },

  requestOtp: async (params: RequestOtpParams): Promise<{ message: string; email: string }> => {
    if (!params.email) {
      throw new NotImplementedError('authService.requestOtp (SMS OTP is not implemented on backend)');
    }

    const res = await apiClient.post<{ success: boolean; data: { message: string; email: string } }>(
      '/auth/otp/request',
      {
        email: params.email.trim().toLowerCase(),
        purpose: params.purpose || 'REGISTRATION',
      }
    );

    return res.data;
  },

  verifyOtp: async (params: VerifyOtpParams): Promise<{ verified: boolean; user?: UserProfile }> => {
    if (!params.email) {
      throw new NotImplementedError('authService.verifyOtp (SMS OTP is not implemented on backend)');
    }

    const res = await apiClient.post<VerifyOtpApiResponse>('/auth/otp/verify', {
      email: params.email.trim().toLowerCase(),
      otp: params.otp.trim(),
      purpose: params.purpose || 'REGISTRATION',
    });

    if (res.data?.tokens?.accessToken && res.data?.user) {
      await tokenStorage.saveTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
      useAuthStore.getState().setSession(res.data.user);
    }

    return {
      verified: res.data?.verified ?? false,
      user: res.data?.user,
    };
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) return null;

      const res = await apiClient.get<{ success: boolean; data: UserProfile }>('/auth/me');
      if (res.data) {
        useAuthStore.getState().setSession(res.data);
        return res.data;
      }
      return null;
    } catch (err) {
      logger.debug('Failed to get current user session', { err });
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (err) {
      logger.debug('Error invoking backend logout', { err });
    } finally {
      await tokenStorage.clearTokens();
      useAuthStore.getState().clearSession();
    }
  },

  initAuth: async (): Promise<void> => {
    useAuthStore.getState().setLoading(true);
    try {
      await authService.getCurrentUser();
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },
};
