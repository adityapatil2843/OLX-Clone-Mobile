import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { ApiError, refreshAccessToken } from './api-client';
import { env } from '../config/env';
import { tokenStorage } from './token-storage';
import { logger } from '../utils/logger';
import { NotImplementedError } from './auth.service';
import { listingUploadService, BatchUploadProgress, PhotoUploadItem } from './listing-upload.service';
import { uploadSessionStorage, PersistedUploadSession } from './upload-session.storage';

export interface UploadSignedUrlResponse {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  uploadToken?: string;
  context?: string;
  stub?: boolean;
}

export interface UploadMediaParams {
  uri: string;
  type: 'image' | 'video';
  name?: string;
  mimeType?: string;
}

/**
 * Universal cross-platform multipart file uploader.
 * Handles both:
 * - Web (fetches blob URI into actual Blob object so browser FormData does not stringify it)
 * - Native Android / iOS (uses FileSystem.uploadAsync for native speed and reliability)
 */
async function uploadFileCrossPlatform(
  url: string,
  token: string | null,
  fileUri: string,
  fieldName: string,
  fileName: string,
  mimeType: string,
  extraFields?: Record<string, string>,
  httpMethod: 'POST' | 'PATCH' = 'POST'
): Promise<any> {
  logger.info(`[Media Upload] Starting upload to ${url}`, {
    fieldName,
    fileName,
    mimeType,
    method: httpMethod,
    platform: Platform.OS,
  });

  // 1. Web Platform (Browser)
  if (Platform.OS === 'web') {
    const formData = new FormData();
    try {
      const blobRes = await fetch(fileUri);
      const blob = await blobRes.blob();
      formData.append(fieldName, blob, fileName);
    } catch (blobErr) {
      logger.warn('[Media Upload] Could not fetch blob for uri, fallback to raw uri', {
        fileUri,
        blobErr,
      });
      formData.append(fieldName, fileUri);
    }

    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    }

    const response = await fetch(url, {
      method: httpMethod,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.message || `Upload failed with HTTP ${response.status}`,
        response.status
      );
    }
    return json.data;
  }

  // 2. Native Mobile (Android & iOS)
  try {
    const uploadResult = await FileSystem.uploadAsync(url, fileUri, {
      httpMethod,
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName,
      mimeType,
      parameters: extraFields || {},
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(uploadResult.body);
    } catch {
      parsed = { success: uploadResult.status >= 200 && uploadResult.status < 300 };
    }

    if (uploadResult.status < 200 || uploadResult.status >= 300 || !parsed.success) {
      throw new ApiError(
        parsed.error?.message || `Native upload failed with status ${uploadResult.status}`,
        uploadResult.status
      );
    }
    return parsed.data;
  } catch (fsErr: any) {
    logger.warn('[Media Upload] FileSystem.uploadAsync error, falling back to React Native FormData', {
      err: fsErr?.message,
    });

    // Fallback to React Native FormData fetch
    const formData = new FormData();
    formData.append(fieldName, {
      uri: fileUri,
      type: mimeType || 'video/mp4',
      name: fileName || 'upload.mp4',
    } as any);

    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    }

    const response = await fetch(url, {
      method: httpMethod,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.message || `Fallback upload failed with HTTP ${response.status}`,
        response.status
      );
    }
    return json.data;
  }
}

async function uploadFileWithRefresh(
  url: string,
  token: string | null,
  fileUri: string,
  fieldName: string,
  fileName: string,
  mimeType: string,
  extraFields?: Record<string, string>,
  httpMethod: 'POST' | 'PATCH' = 'POST'
): Promise<any> {
  try {
    return await uploadFileCrossPlatform(url, token, fileUri, fieldName, fileName, mimeType, extraFields, httpMethod);
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
    const freshToken = await refreshAccessToken();
    return uploadFileCrossPlatform(url, freshToken, fileUri, fieldName, fileName, mimeType, extraFields, httpMethod);
  }
}

export const mediaService = {
  uploadChatImage: async (
    conversationId: string,
    params: { uri: string; name?: string; mimeType?: string }
  ): Promise<{ url: string; mimeType?: string; size?: number }> => {
    const token = await tokenStorage.getAccessToken();
    const extension = params.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = params.name || `chat_image.${extension}`;
    const mimeType = params.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');

    return uploadFileWithRefresh(
      `${env.API_BASE_URL}/conversations/${conversationId}/images`,
      token,
      params.uri,
      'file',
      fileName,
      mimeType
    );
  },

  /**
   * Request server-controlled signed upload payload from backend.
   */
  requestUploadUrl: async (
    reelIdOrParams: string | { fileName?: string; fileType?: string; fileSizeBytes?: number; reelId?: string },
    optionalParams?: { fileName?: string; fileType?: string; fileSizeBytes?: number }
  ): Promise<UploadSignedUrlResponse> => {
    const reelId = typeof reelIdOrParams === 'string' ? reelIdOrParams : reelIdOrParams?.reelId;
    const params = typeof reelIdOrParams === 'string' ? optionalParams : reelIdOrParams;

    if (!reelId) {
      throw new NotImplementedError('mediaService.requestUploadUrl without reelId');
    }

    const token = await tokenStorage.getAccessToken();
    const res = await fetch(`${env.API_BASE_URL}/reels/${reelId}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        fileName: params?.fileName,
        fileType: params?.fileType,
        fileSizeBytes: params?.fileSizeBytes,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new ApiError(
        json.error?.message || `Failed to obtain upload authorization (HTTP ${res.status})`,
        res.status
      );
    }
    return json.data;
  },

  uploadListingMedia: async (
    listingId: string,
    params: UploadMediaParams,
    options?: { signal?: AbortSignal; onProgress?: (percent: number, loaded: number, total: number) => void }
  ): Promise<{ id: string; storageKey: string; thumbnailKey?: string; type: string; url?: string }> => {
    // Fast path: Images use optimized client-side resize and direct signed Cloudinary upload
    if (params.type === 'image') {
      try {
        const directResult = await listingUploadService.uploadSinglePhoto(
          listingId,
          {
            uri: params.uri,
            fileName: params.name,
            mimeType: params.mimeType,
          },
          {
            signal: options?.signal,
            onProgress: options?.onProgress,
          }
        );
        return {
          id: directResult.id,
          storageKey: directResult.storageKey,
          thumbnailKey: directResult.thumbnailKey || undefined,
          type: directResult.type,
          url: directResult.url || directResult.thumbnailKey || undefined,
        };
      } catch (directErr: any) {
        if (directErr.name === 'AbortError' || directErr.code === 'UPLOAD_ABORTED') {
          throw directErr;
        }
        logger.warn('[Media Service] Direct signed upload failed, attempting fallback to backend upload', {
          err: directErr?.message,
        });
      }
    }

    // Fallback path: standard backend multipart endpoint
    const token = await tokenStorage.getAccessToken();
    const isVideo = params.type === 'video';
    const ext = isVideo ? 'mp4' : (params.name?.split('.').pop() || 'jpg');
    const filename = params.name || (isVideo ? 'listing_video.mp4' : `listing_image.${ext}`);
    const mimeType = params.mimeType || (isVideo ? 'video/mp4' : `image/${ext === 'png' ? 'png' : 'jpeg'}`);

    try {
      return await uploadFileWithRefresh(
        `${env.API_BASE_URL}/listings/${listingId}/media/upload`,
        token,
        params.uri,
        'file',
        filename,
        mimeType
      );
    } catch (err) {
      logger.error('Failed to upload listing media', { err });
      throw err;
    }
  },

  uploadMultipleListingImages: async (
    listingId: string,
    items: (string | { uri: string; name?: string; mimeType?: string; fileName?: string })[],
    options?: {
      concurrencyLimit?: number;
      signal?: AbortSignal;
      onProgress?: (progress: BatchUploadProgress) => void;
    }
  ): Promise<any[]> => {
    if (!items || items.length === 0) return [];

    const normalized: PhotoUploadItem[] = items.map((item, i) => {
      if (typeof item === 'string') {
        return { uri: item, fileName: `listing_photo_${i + 1}.jpg` };
      }
      return {
        uri: item.uri,
        fileName: item.fileName || item.name || `listing_photo_${i + 1}.jpg`,
        mimeType: item.mimeType,
      };
    });

    try {
      // Parallel, bounded concurrency (default 3 concurrent), direct signed upload with progress & retries
      return await listingUploadService.uploadPhotosBatch(listingId, normalized, {
        concurrencyLimit: options?.concurrencyLimit ?? 3,
        signal: options?.signal,
        onOverallProgress: options?.onProgress,
      });
    } catch (batchErr: any) {
      if (batchErr.name === 'AbortError' || batchErr.code === 'UPLOAD_ABORTED') {
        throw batchErr;
      }
      logger.warn('[Media Service] Batch signed upload failed, falling back to sequential backend upload', {
        err: batchErr?.message,
      });

      // Fallback path: sequential backend uploads
      const results = [];
      for (let i = 0; i < normalized.length; i++) {
        const item = normalized[i];
        const res = await mediaService.uploadListingMedia(listingId, {
          uri: item.uri,
          type: 'image',
          name: item.fileName,
          mimeType: item.mimeType,
        });
        results.push(res);
      }
      return results;
    }
  },

  /**
   * Resumable chunked Cloudinary upload with onprogress tracking and offset persistence.
   * - Slices video into 5 MB chunks supported by Cloudinary Content-Range.
   * - Persists provider upload/session ID and confirmed offset in uploadSessionStorage.
   * - Retries failed chunks with bounded exponential backoff without restarting from 0.
   * - Allows resuming across network drops, retries, and app backgrounding.
   * - Cleans up session storage on completion.
   */
  uploadReelMedia: async (
    reelId: string,
    videoUri: string,
    options?: {
      fileName?: string;
      mimeType?: string;
      fileSizeBytes?: number;
      durationMs?: number;
      thumbnailUri?: string;
      signal?: AbortSignal;
      maxRetries?: number;
      onProgress?: (percent: number, loaded: number, total: number) => void;
    }
  ): Promise<{ id: string; videoUrl?: string; publicId?: string; uploadToken?: string }> => {
    // 1. Preliminary declared size check (500 MB limit)
    const MAX_ALLOWED_BYTES = 500 * 1024 * 1024;
    if (options?.fileSizeBytes && options.fileSizeBytes > MAX_ALLOWED_BYTES) {
      throw new ApiError('Selected video exceeds the 500 MB maximum size limit', 413);
    }

    // 1b. Preliminary declared duration check (120 seconds / 2 minutes limit)
    const MAX_ALLOWED_DURATION_MS = 120 * 1000;
    if (options?.durationMs && options.durationMs > MAX_ALLOWED_DURATION_MS) {
      throw new ApiError('Selected video exceeds the 2 minutes (120 seconds) maximum duration limit', 422);
    }

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

    // 2. Check for an existing resumable session to resume from
    let session = await uploadSessionStorage.getUploadSession(reelId);
    let signedParams: UploadSignedUrlResponse;
    let uploadSessionId: string;

    if (session && session.videoUri === videoUri && session.signedParams) {
      logger.info(`[Media Upload] Resuming existing upload session for reel ${reelId} from byte offset ${session.confirmedOffset}`);
      signedParams = session.signedParams;
      uploadSessionId = session.uploadSessionId;
    } else {
      logger.info(`[Media Upload] Initializing new signed upload session for reel ${reelId}`);
      signedParams = await mediaService.requestUploadUrl(reelId, {
        fileName: resolvedName,
        fileType: resolvedMime,
        fileSizeBytes: options?.fileSizeBytes,
      });

      uploadSessionId = `sess_${reelId.replace(/-/g, '')}_${Date.now()}`;
      const totalEstimatedBytes = options?.fileSizeBytes || 10485760;

      session = {
        reelId,
        videoUri,
        uploadUrl: signedParams.uploadUrl,
        uploadSessionId,
        publicId: signedParams.publicId,
        confirmedOffset: 0,
        totalBytes: totalEstimatedBytes,
        signedParams,
        updatedAt: Date.now(),
      };
      await uploadSessionStorage.saveUploadSession(session);
    }

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB standard Cloudinary chunk size

    // 3. Handle dev stub if Cloudinary credentials are not configured
    if (signedParams.stub) {
      logger.warn('[Media Upload] Cloudinary stub returned from backend, simulating resumable chunked upload');
      const totalBytes = options?.fileSizeBytes || session.totalBytes || 10485760;
      let currentOffset = session.confirmedOffset || 0;

      while (currentOffset < totalBytes) {
        if (options?.signal?.aborted) {
          throw new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED');
        }
        const end = Math.min(currentOffset + CHUNK_SIZE - 1, totalBytes - 1);
        currentOffset = end + 1;
        await uploadSessionStorage.updateUploadOffset(reelId, currentOffset);

        const clampedPercent = Math.max(0, Math.min(100, Math.round((currentOffset / totalBytes) * 100)));
        options?.onProgress?.(clampedPercent, currentOffset, totalBytes);
      }

      await uploadSessionStorage.clearUploadSession(reelId);
      return {
        id: reelId,
        videoUrl: `https://placeholder.cloudinary.com/${signedParams.publicId}`,
        publicId: signedParams.publicId,
        uploadToken: signedParams.uploadToken,
      };
    }

    // 4. Fetch source blob if possible (Web and modern RN environment)
    let sourceBlob: Blob | null = null;
    try {
      const blobRes = await fetch(videoUri);
      sourceBlob = await blobRes.blob();
    } catch (err) {
      logger.warn('[Media Upload] Could not fetch video blob directly', { err });
    }

    const totalBytes = sourceBlob?.size || options?.fileSizeBytes || session.totalBytes || 10485760;
    let confirmedOffset = session.confirmedOffset || 0;
    const maxRetries = options?.maxRetries ?? 3;
    let finalResult: any = null;

    // 5. Upload chunks sequentially with exponential backoff and resume
    while (confirmedOffset < totalBytes) {
      if (options?.signal?.aborted) {
        throw new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED');
      }

      const start = confirmedOffset;
      const end = Math.min(start + CHUNK_SIZE - 1, totalBytes - 1);
      const isLastChunk = end >= totalBytes - 1;

      let chunkBlob: any = null;
      if (sourceBlob) {
        chunkBlob = sourceBlob.slice(start, end + 1, resolvedMime);
      } else {
        // Fallback for native multipart when blob slicing isn't supported
        chunkBlob = {
          uri: videoUri,
          type: resolvedMime,
          name: resolvedName,
        };
      }

      let attempt = 0;
      let chunkSuccess = false;

      while (!chunkSuccess && attempt <= maxRetries) {
        if (options?.signal?.aborted) {
          throw new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED');
        }

        try {
          const chunkRes = await new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', signedParams.uploadUrl);

            // Cloudinary chunked headers
            xhr.setRequestHeader('Content-Range', `bytes ${start}-${end}/${totalBytes}`);
            xhr.setRequestHeader('X-Unique-Upload-Id', uploadSessionId);

            const abortHandler = () => {
              xhr.abort();
              reject(new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED'));
            };
            if (options?.signal) {
              options.signal.addEventListener('abort', abortHandler, { once: true });
            }

            if (xhr.upload && options?.onProgress) {
              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && event.total > 0) {
                  const chunkLoaded = Math.min(event.loaded, event.total);
                  const currentTotalLoaded = Math.min(totalBytes, start + chunkLoaded);
                  const clampedPercent = Math.max(0, Math.min(100, Math.round((currentTotalLoaded / totalBytes) * 100)));
                  options.onProgress?.(clampedPercent, currentTotalLoaded, totalBytes);
                }
              };
            }

            xhr.onload = () => {
              if (options?.signal) {
                options.signal.removeEventListener('abort', abortHandler);
              }
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const parsed = JSON.parse(xhr.responseText);
                  resolve(parsed);
                } catch {
                  resolve({ status: 'success' });
                }
              } else {
                let errorMsg = `Cloudinary chunk upload failed (HTTP ${xhr.status})`;
                try {
                  const errObj = JSON.parse(xhr.responseText);
                  if (errObj.error?.message) errorMsg = errObj.error.message;
                } catch {}
                reject(new ApiError(errorMsg, xhr.status));
              }
            };

            xhr.onerror = () => {
              if (options?.signal) {
                options.signal.removeEventListener('abort', abortHandler);
              }
              reject(new ApiError('Network error during video chunk upload', 0));
            };

            xhr.ontimeout = () => {
              if (options?.signal) {
                options.signal.removeEventListener('abort', abortHandler);
              }
              reject(new ApiError('Video chunk upload timed out', 408));
            };

            xhr.timeout = 5 * 60 * 1000;

            const formData = new FormData();
            formData.append('file', chunkBlob, resolvedName);
            formData.append('api_key', signedParams.apiKey);
            formData.append('timestamp', String(signedParams.timestamp));
            formData.append('signature', signedParams.signature);
            formData.append('folder', signedParams.folder);
            formData.append('public_id', signedParams.publicId);
            if (signedParams.context) {
              formData.append('context', signedParams.context);
            }

            xhr.send(formData);
          });

          chunkSuccess = true;
          confirmedOffset = end + 1;
          await uploadSessionStorage.updateUploadOffset(reelId, confirmedOffset);

          const clampedPercent = Math.max(0, Math.min(100, Math.round((confirmedOffset / totalBytes) * 100)));
          options?.onProgress?.(clampedPercent, confirmedOffset, totalBytes);

          if (isLastChunk) {
            finalResult = chunkRes;
          }
        } catch (chunkErr: any) {
          if (options?.signal?.aborted || chunkErr.name === 'AbortError' || chunkErr.code === 'UPLOAD_ABORTED') {
            throw chunkErr;
          }

          attempt++;
          if (attempt > maxRetries) {
            logger.error(`[Media Upload] Chunk ${start}-${end} failed after ${maxRetries} retries`, { err: chunkErr.message });
            throw chunkErr;
          }

          const backoffDelay = Math.min(8000, 1000 * Math.pow(2, attempt - 1)) + Math.random() * 200;
          logger.warn(`[Media Upload] Chunk ${start}-${end} failed, retrying in ${Math.round(backoffDelay)}ms (attempt ${attempt}/${maxRetries})`, { err: chunkErr.message });
          await new Promise((r) => setTimeout(r, backoffDelay));
        }
      }
    }

    // 6. Complete session cleanup and return final media identifiers
    await uploadSessionStorage.clearUploadSession(reelId);
    return {
      id: reelId,
      videoUrl: finalResult?.secure_url || finalResult?.url,
      publicId: finalResult?.public_id || signedParams.publicId,
      uploadToken: signedParams.uploadToken,
    };
  },

  uploadAvatar: async (
    userId: string,
    imageUri: string,
    options?: {
      fileName?: string;
      mimeType?: string;
    }
  ): Promise<any> => {
    const token = await tokenStorage.getAccessToken();
    const guessedExt = imageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const resolvedName = options?.fileName || `avatar_${Date.now()}.${guessedExt}`;
    const resolvedMime = options?.mimeType || (guessedExt === 'png' ? 'image/png' : 'image/jpeg');

    try {
      return await uploadFileWithRefresh(
        `${env.API_BASE_URL}/users/${userId}/profile`,
        token,
        imageUri,
        'avatar',
        resolvedName,
        resolvedMime,
        undefined,
        'PATCH'
      );
    } catch (err) {
      logger.error('Failed to upload user avatar', { err });
      throw err;
    }
  },
};
