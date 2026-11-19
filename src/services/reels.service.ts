import { apiClient } from './api-client';

export interface ReelCreator {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isVerifiedSeller?: boolean;
}

export interface ReelLinkedListing {
  id: string;
  title: string;
  price: number;
  currency?: string;
  locationCity?: string | null;
  locationState?: string | null;
}

export interface ReelComment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export type ReelStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'PUBLISHED'
  | 'DRAFT'
  | 'ARCHIVED';

export interface Reel {
  id: string;
  title: string;
  caption?: string | null;
  description?: string | null;
  status?: ReelStatus | string;
  videoUrl?: string | null;
  hlsUrl?: string | null;
  videoStorageKey?: string | null;
  thumbnailUrl?: string | null;
  customThumbnailUrl?: string | null;
  thumbnailStorageKey?: string | null;
  processingError?: string | null;
  durationMs?: number;
  width?: number;
  height?: number;
  creatorId: string;
  listingId?: string | null;
  creator?: ReelCreator;
  listing?: ReelLinkedListing | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
}

export interface CreateReelPayload {
  caption?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  categoryId?: string | null;
  locationText?: string | null;
  listingId?: string | null;
  videoStorageKey?: string | null;
  thumbnailStorageKey?: string | null;
  videoProvider?: string | null;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface ConfirmUploadPayload {
  videoStorageKey?: string;
  storageKey?: string;
  thumbnailStorageKey?: string | null;
  thumbnailKey?: string | null;
  videoProvider?: string;
  provider?: string;
  uploadToken?: string;
  mimeType?: string;
  fileType?: string;
  sizeBytes?: number;
  fileSizeBytes?: number;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface UpdateReelPayload {
  caption?: string;
  hashtags?: string[];
  categoryId?: string | null;
  locationText?: string | null;
  listingId?: string | null;
  status?: ReelStatus | string;
}

export interface ListReelsQuery {
  listingId?: string;
  creatorId?: string;
  page?: number;
  limit?: number;
}

export interface ReelsApiResponse {
  success: boolean;
  data: Reel[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
  };
}

export const reelsService = {
  getReels: async (query?: ListReelsQuery): Promise<{ data: Reel[]; meta: ReelsApiResponse['meta'] }> => {
    const params = new URLSearchParams();
    if (query?.listingId) params.append('listingId', query.listingId);
    if (query?.creatorId) params.append('creatorId', query.creatorId);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString();
    const res = await apiClient.get<ReelsApiResponse>(`/reels${queryString ? `?${queryString}` : ''}`);
    return { data: res.data, meta: res.meta };
  },

  getReelById: async (reelId: string): Promise<Reel> => {
    const res = await apiClient.get<{ success: boolean; data: Reel }>(`/reels/${reelId}`);
    return res.data;
  },

  createReel: async (payload: CreateReelPayload): Promise<Reel> => {
    const caption =
      payload.caption !== undefined
        ? payload.caption
        : payload.title
        ? payload.description
          ? `${payload.title}\n\n${payload.description}`
          : payload.title
        : payload.description || undefined;

    const body: Record<string, any> = {};
    if (caption !== undefined) body.caption = caption;
    if (payload.hashtags !== undefined) body.hashtags = payload.hashtags;
    if (payload.categoryId !== undefined) body.categoryId = payload.categoryId;
    if (payload.locationText !== undefined) body.locationText = payload.locationText;
    if (payload.listingId !== undefined) body.listingId = payload.listingId;
    if (payload.videoStorageKey !== undefined) body.videoStorageKey = payload.videoStorageKey;
    if (payload.thumbnailStorageKey !== undefined) body.thumbnailStorageKey = payload.thumbnailStorageKey;
    if (payload.videoProvider !== undefined) body.videoProvider = payload.videoProvider;
    if (payload.durationMs !== undefined) body.durationMs = payload.durationMs;
    if (payload.width !== undefined) body.width = payload.width;
    if (payload.height !== undefined) body.height = payload.height;

    const res = await apiClient.post<{ success: boolean; data: Reel }>('/reels', body);
    return {
      ...res.data,
      title: payload.title || res.data.title || res.data.caption || 'Product Reel',
      description: payload.description || res.data.description || res.data.caption,
    };
  },

  confirmUpload: async (reelId: string, payload: ConfirmUploadPayload): Promise<Reel> => {
    const res = await apiClient.post<{ success: boolean; data: Reel }>(
      `/reels/${reelId}/confirm-upload`,
      payload
    );
    return res.data;
  },

  cancelUpload: async (reelId: string): Promise<void> => {
    await apiClient.post(`/reels/${reelId}/cancel-upload`);
  },

  updateReel: async (reelId: string, payload: UpdateReelPayload): Promise<Reel> => {
    const res = await apiClient.patch<{ success: boolean; data: Reel }>(
      `/reels/${reelId}`,
      payload
    );
    return res.data;
  },

  likeReel: async (reelId: string): Promise<void> => {
    await apiClient.post(`/reels/${reelId}/like`);
  },

  unlikeReel: async (reelId: string): Promise<void> => {
    await apiClient.delete(`/reels/${reelId}/like`);
  },

  saveReel: async (reelId: string): Promise<void> => {
    await apiClient.post(`/reels/${reelId}/save`);
  },

  unsaveReel: async (reelId: string): Promise<void> => {
    await apiClient.delete(`/reels/${reelId}/save`);
  },

  getComments: async (reelId: string, page = 1, limit = 30): Promise<ReelComment[]> => {
    const res = await apiClient.get<{ success: boolean; data: ReelComment[] }>(
      `/reels/${reelId}/comments?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  addComment: async (reelId: string, text: string): Promise<ReelComment> => {
    const res = await apiClient.post<{ success: boolean; data: ReelComment }>(
      `/reels/${reelId}/comments`,
      { text }
    );
    return res.data;
  },
};
