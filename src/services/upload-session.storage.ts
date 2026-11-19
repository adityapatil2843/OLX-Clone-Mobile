import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

export interface PersistedUploadSession {
  reelId: string;
  videoUri: string;
  uploadUrl: string;
  uploadSessionId: string; // X-Unique-Upload-Id
  publicId: string;
  confirmedOffset: number;
  totalBytes: number;
  signedParams: any;
  updatedAt: number;
}

const STORAGE_PREFIX = 'reel_upload_session_';
const memorySessions = new Map<string, PersistedUploadSession>();

const isSecureStoreAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const uploadSessionStorage = {
  saveUploadSession: async (session: PersistedUploadSession): Promise<void> => {
    const key = `${STORAGE_PREFIX}${session.reelId}`;
    memorySessions.set(session.reelId, session);

    try {
      const serialized = JSON.stringify(session);
      if (await isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(key, serialized);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, serialized);
      }
    } catch (err) {
      logger.warn('[UploadSessionStorage] Failed to persist session to disk, retained in memory', { err });
    }
  },

  getUploadSession: async (reelId: string): Promise<PersistedUploadSession | null> => {
    const memory = memorySessions.get(reelId);
    if (memory) return memory;

    const key = `${STORAGE_PREFIX}${reelId}`;
    try {
      let raw: string | null = null;
      if (await isSecureStoreAvailable()) {
        raw = await SecureStore.getItemAsync(key);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(key);
      }

      if (raw) {
        const parsed = JSON.parse(raw) as PersistedUploadSession;
        memorySessions.set(reelId, parsed);
        return parsed;
      }
    } catch (err) {
      logger.warn('[UploadSessionStorage] Failed to read session from disk', { err });
    }
    return null;
  },

  updateUploadOffset: async (reelId: string, confirmedOffset: number): Promise<void> => {
    const existing = await uploadSessionStorage.getUploadSession(reelId);
    if (!existing) return;

    const updated: PersistedUploadSession = {
      ...existing,
      confirmedOffset,
      updatedAt: Date.now(),
    };
    await uploadSessionStorage.saveUploadSession(updated);
  },

  clearUploadSession: async (reelId: string): Promise<void> => {
    memorySessions.delete(reelId);
    const key = `${STORAGE_PREFIX}${reelId}`;

    try {
      if (await isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (err) {
      logger.warn('[UploadSessionStorage] Failed to delete session from disk', { err });
    }
  },
};
