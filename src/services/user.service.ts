import { apiClient } from './api-client';
import { UserProfile } from '../types/user';

export interface UpdateProfilePayload {
  name?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
}

export const userService = {
  getUserProfile: async (userId: string): Promise<UserProfile> => {
    const res = await apiClient.get<{ success: boolean; data: UserProfile }>(`/users/${userId}`);
    return res.data;
  },

  updateProfile: async (userId: string, payload: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await apiClient.patch<{ success: boolean; data: UserProfile }>(
      `/users/${userId}/profile`,
      payload
    );
    return res.data;
  },
};
