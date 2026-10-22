import { ApiError } from './api-client';
import { env } from '../config/env';
import { tokenStorage } from './token-storage';
import { logger } from '../utils/logger';
import { NotImplementedError } from './auth.service';

export interface UploadSignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface UploadMediaParams {
  uri: string;
  type: 'image' | 'video';
  name?: string;
  mimeType?: string;
}

export const mediaService = {
  requestUploadUrl: async (_params: { fileName: string; fileType: string }): Promise<UploadSignedUrlResponse> => {
    throw new NotImplementedError('mediaService.requestUploadUrl (backend uses direct multipart upload)');
  },
  uploadListingMedia: async (
    listingId: string,
    params: UploadMediaParams
  ): Promise<{ id: string; storageKey: string; thumbnailKey?: string; type: string }> => {
    const token = await tokenStorage.getAccessToken();
    const formData = new FormData();

    const filename = params.name || (params.type === 'video' ? 'listing_video.mp4' : 'listing_image.jpg');
    const mimeType = params.mimeType || (params.type === 'video' ? 'video/mp4' : 'image/jpeg');

    // React Native FormData file object structure
    formData.append('file', {
      uri: params.uri,
      name: filename,
      type: mimeType,
    } as any);

    try {
      const response = await fetch(`${env.API_BASE_URL}/listings/${listingId}/media/upload`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new ApiError(
          json.error?.message || 'Failed to upload listing media',
          response.status
        );
      }

      return json.data;
    } catch (err) {
      logger.error('Failed to upload listing media', { err });
      throw err;
    }
  },

  uploadReelMedia: async (
    reelId: string,
    videoUri: string,
    thumbnailUri?: string
  ): Promise<{ id: string; videoUrl?: string }> => {
    const token = await tokenStorage.getAccessToken();
    const formData = new FormData();

    formData.append('video', {
      uri: videoUri,
      name: 'reel_video.mp4',
      type: 'video/mp4',
    } as any);

    if (thumbnailUri) {
      formData.append('thumbnail', {
        uri: thumbnailUri,
        name: 'reel_thumb.jpg',
        type: 'image/jpeg',
      } as any);
    }

    try {
      const response = await fetch(`${env.API_BASE_URL}/reels/${reelId}/upload`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new ApiError(
          json.error?.message || 'Failed to upload reel video',
          response.status
        );
      }

      return json.data;
    } catch (err) {
      logger.error('Failed to upload reel media', { err });
      throw err;
    }
  },
};
