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

  uploadMultipleListingImages: async (
    listingId: string,
    uris: string[]
  ): Promise<any[]> => {
    const results = [];
    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      const res = await mediaService.uploadListingMedia(listingId, {
        uri,
        type: 'image',
        name: `listing_image_${i + 1}.jpg`,
        mimeType: 'image/jpeg',
      });
      results.push(res);
    }
    return results;
  },

  uploadReelMedia: async (
    reelId: string,
    videoUri: string,
    options?: {
      fileName?: string;
      mimeType?: string;
      thumbnailUri?: string;
    }
  ): Promise<{ id: string; videoUrl?: string }> => {
    const token = await tokenStorage.getAccessToken();
    const formData = new FormData();

    // Determine extension and proper MIME type for any video format
    const uriParts = videoUri.split('.');
    const ext = (options?.fileName?.split('.').pop() || uriParts.pop() || 'mp4').toLowerCase().split('?')[0];
    
    let resolvedMime = options?.mimeType;
    if (!resolvedMime) {
      if (ext === 'mov') resolvedMime = 'video/quicktime';
      else if (ext === 'webm') resolvedMime = 'video/webm';
      else if (ext === 'avi') resolvedMime = 'video/x-msvideo';
      else if (ext === 'mkv') resolvedMime = 'video/x-matroska';
      else if (ext === '3gp') resolvedMime = 'video/3gpp';
      else if (ext === 'm4v') resolvedMime = 'video/m4v';
      else resolvedMime = 'video/mp4';
    }

    const resolvedName = options?.fileName || `reel_video.${ext}`;

    formData.append('video', {
      uri: videoUri,
      name: resolvedName,
      type: resolvedMime,
    } as any);

    if (options?.thumbnailUri) {
      formData.append('thumbnail', {
        uri: options.thumbnailUri,
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
