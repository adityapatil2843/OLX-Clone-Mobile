import { apiClient } from './api-client';

export interface BoostPackage {
  id: string;
  name: string;
  durationDays: number;
  coinsCost: number;
  isActive: boolean;
  sortOrder: number;
}

export type AdTargetType = 'LISTING' | 'REEL';
export type AdStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';

export interface Advertisement {
  id: string;
  ownerId: string;
  targetType: AdTargetType;
  targetId: string;
  title: string;
  status: AdStatus;
  packageId?: string | null;
  packageDays?: number | null;
  coinsSpent?: number | null;
  startDate: string;
  endDate?: string | null;
  stoppedAt?: string | null;
  listing?: {
    id: string;
    title: string;
    price: number;
    media?: { url?: string; thumbnailKey?: string }[];
  } | null;
  reel?: {
    id: string;
    title?: string | null;
    caption?: string | null;
    thumbnailUrl?: string | null;
    customThumbnailUrl?: string | null;
  } | null;
  createdAt: string;
}

export interface CreateBoostPayload {
  targetType: AdTargetType;
  targetId: string;
  packageId: string;
  idempotencyKey?: string;
}

export interface BoostPackagesResponse {
  success: boolean;
  data: BoostPackage[];
}

export interface AdvertisementsResponse {
  success: boolean;
  data: Advertisement[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
  };
}

export const boostService = {
  getPackages: async (): Promise<BoostPackage[]> => {
    const res = await apiClient.get<BoostPackagesResponse>('/boost-packages');
    return res.data;
  },

  createBoost: async (payload: CreateBoostPayload): Promise<Advertisement> => {
    // Only send allowed fields to comply with backend strict schema
    const body = {
      targetType: payload.targetType,
      targetId: payload.targetId,
      packageId: payload.packageId,
      ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
    };
    const res = await apiClient.post<{ success: boolean; data: Advertisement }>(
      '/advertisements',
      body
    );
    return res.data;
  },

  getMyAdvertisements: async (
    page = 1,
    limit = 20
  ): Promise<{ data: Advertisement[]; meta: AdvertisementsResponse['meta'] }> => {
    const res = await apiClient.get<AdvertisementsResponse>(
      `/advertisements?page=${page}&limit=${limit}`
    );
    return { data: res.data, meta: res.meta };
  },

  cancelBoost: async (id: string): Promise<Advertisement> => {
    const res = await apiClient.post<{ success: boolean; data: Advertisement }>(
      `/advertisements/${id}/cancel`
    );
    return res.data;
  },
};
