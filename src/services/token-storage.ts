import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'mandi_access_token';
const REFRESH_TOKEN_KEY = 'mandi_refresh_token';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

const isSecureStoreAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    try {
      if (await isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(ACCESS_TOKEN_KEY);
      }
      return memoryAccessToken;
    } catch {
      return memoryAccessToken;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      if (await isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }
      return memoryRefreshToken;
    } catch {
      return memoryRefreshToken;
    }
  },

  saveTokens: async (accessToken: string, refreshToken?: string | null): Promise<void> => {
    memoryAccessToken = accessToken;
    if (refreshToken) {
      memoryRefreshToken = refreshToken;
    }

    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        }
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      }
    } catch {
      // Memory fallback active
    }
  },

  clearTokens: async (): Promise<void> => {
    memoryAccessToken = null;
    memoryRefreshToken = null;

    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      // Memory cleared
    }
  },
};
