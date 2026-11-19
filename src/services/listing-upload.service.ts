import { Platform } from 'react-native';
import { env } from '../config/env';
import { tokenStorage } from './token-storage';
import { ApiError } from './api-error';
import { logger } from '../utils/logger';
import { optimizeListingImage, OptimizedImageResult } from './image-optimization.service';

export interface PhotoUploadItem {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

export interface SinglePhotoUploadOptions {
  displayOrder?: number;
  timeoutMs?: number;
  maxRetries?: number;
  initialRetryDelayMs?: number;
  signal?: AbortSignal;
  onProgress?: (percent: number, loaded: number, total: number) => void;
}

export interface BatchUploadOptions {
  concurrencyLimit?: number;
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
  cleanupOnFailure?: boolean;
  onOverallProgress?: (progress: BatchUploadProgress) => void;
  onFileProgress?: (fileIndex: number, percent: number, loaded: number, total: number) => void;
}

export interface BatchUploadProgress {
  completedCount: number;
  totalCount: number;
  overallPercent: number;
  inProgressCount: number;
  failedCount: number;
}

export interface UploadedMediaItemResult {
  id: string;
  listingId: string;
  type: string;
  storageKey: string;
  provider: string;
  thumbnailKey?: string | null;
  displayOrder: number;
  url?: string;
}

export interface SignedUploadSignatureResponse {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: string;
  stub?: boolean;
}

/** Check if an error is transient (network drop, timeout, 5xx, or 429 rate limit) */
export function isTransientError(error: any): boolean {
  if (!error) return false;
  if (error.name === 'AbortError' || error.message?.includes('aborted')) return false;

  const status = error.statusCode || error.status;
  if (status === 0 || status === 408 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;

  const msg = (error.message || '').toLowerCase();
  if (
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('connection reset') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  ) {
    return true;
  }
  return false;
}

/** Helper to delay with jitter */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 100));

class ListingUploadService {
  /**
   * Request signed upload signature for a single listing photo from backend.
   */
  public async requestUploadSignature(
    listingId: string,
    params: { fileName: string; fileType: string; fileSizeBytes?: number },
    signal?: AbortSignal
  ): Promise<SignedUploadSignatureResponse> {
    const token = await tokenStorage.getAccessToken();
    const res = await fetch(`${env.API_BASE_URL}/listings/${listingId}/media/upload-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type: 'IMAGE',
        fileName: params.fileName,
        fileType: params.fileType,
        fileSizeBytes: params.fileSizeBytes || 1024 * 1024,
      }),
      signal,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new ApiError(
        json.error?.message || `Failed to obtain upload signature (HTTP ${res.status})`,
        res.status
      );
    }
    return json.data;
  }

  /**
   * Attach successfully uploaded storageKey to listing in database.
   */
  public async attachMediaToListing(
    listingId: string,
    data: {
      type: 'IMAGE' | 'VIDEO';
      storageKey: string;
      thumbnailKey?: string;
      displayOrder?: number;
      provider?: 'cloudinary';
    },
    signal?: AbortSignal
  ): Promise<UploadedMediaItemResult> {
    const token = await tokenStorage.getAccessToken();
    const res = await fetch(`${env.API_BASE_URL}/listings/${listingId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type: data.type,
        storageKey: data.storageKey,
        provider: data.provider || 'cloudinary',
        thumbnailKey: data.thumbnailKey,
        displayOrder: data.displayOrder ?? 0,
      }),
      signal,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new ApiError(
        json.error?.message || `Failed to attach media to listing (HTTP ${res.status})`,
        res.status
      );
    }
    return json.data;
  }

  /**
   * Perform direct XMLHttpRequest upload to Cloudinary using signed parameters.
   */
  public async uploadDirectToCloudinary(
    signedParams: SignedUploadSignatureResponse,
    fileUri: string,
    fileName: string,
    mimeType: string,
    options: {
      timeoutMs?: number;
      signal?: AbortSignal;
      onProgress?: (percent: number, loaded: number, total: number) => void;
    } = {}
  ): Promise<{ publicId: string; secureUrl: string; bytes?: number }> {
    if (signedParams.stub) {
      logger.warn('[ListingUpload] Cloudinary unconfigured stub returned, simulating upload');
      options.onProgress?.(100, 1000, 1000);
      return {
        publicId: signedParams.publicId,
        secureUrl: `https://placeholder.cloudinary.com/${signedParams.publicId}`,
      };
    }

    if (options.signal?.aborted) {
      throw new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED');
    }

    // Prepare web Blob if on web platform
    let webBlob: Blob | null = null;
    if (Platform.OS === 'web') {
      try {
        const blobRes = await fetch(fileUri);
        webBlob = await blobRes.blob();
      } catch (err) {
        logger.warn('[ListingUpload] Could not fetch web image blob', { err });
      }
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', signedParams.uploadUrl);

      // Handle abort cancellation
      const abortHandler = () => {
        xhr.abort();
        reject(new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED'));
      };
      if (options.signal) {
        options.signal.addEventListener('abort', abortHandler, { once: true });
      }

      // Progress reporting
      if (xhr.upload && options.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
            options.onProgress?.(percent, event.loaded, event.total);
          }
        };
      }

      xhr.onload = () => {
        if (options.signal) {
          options.signal.removeEventListener('abort', abortHandler);
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resJson = JSON.parse(xhr.responseText);
            resolve({
              publicId: resJson.public_id || signedParams.publicId,
              secureUrl: resJson.secure_url || resJson.url || `https://res.cloudinary.com/${signedParams.publicId}`,
              bytes: resJson.bytes,
            });
          } catch {
            resolve({
              publicId: signedParams.publicId,
              secureUrl: `https://res.cloudinary.com/${signedParams.publicId}`,
            });
          }
        } else {
          let errorMsg = `Cloudinary direct upload failed (HTTP ${xhr.status})`;
          try {
            const errObj = JSON.parse(xhr.responseText);
            if (errObj.error?.message) errorMsg = errObj.error.message;
          } catch {}
          reject(new ApiError(errorMsg, xhr.status));
        }
      };

      xhr.onerror = () => {
        if (options.signal) options.signal.removeEventListener('abort', abortHandler);
        reject(new ApiError('Network failure during photo upload', 0, 'NETWORK_ERROR'));
      };

      xhr.ontimeout = () => {
        if (options.signal) options.signal.removeEventListener('abort', abortHandler);
        reject(new ApiError('Photo upload timed out', 408, 'TIMEOUT'));
      };

      xhr.timeout = options.timeoutMs || 30000; // 30s timeout per photo

      const formData = new FormData();
      if (Platform.OS === 'web' && webBlob) {
        formData.append('file', webBlob, fileName);
      } else {
        formData.append('file', {
          uri: fileUri,
          type: mimeType,
          name: fileName,
        } as any);
      }

      formData.append('api_key', signedParams.apiKey);
      formData.append('timestamp', String(signedParams.timestamp));
      formData.append('signature', signedParams.signature);
      formData.append('folder', signedParams.folder);
      formData.append('public_id', signedParams.publicId);

      xhr.send(formData);
    });
  }

  /**
   * Uploads a single photo with optimization, signed direct upload, retries, and attachment.
   */
  public async uploadSinglePhoto(
    listingId: string,
    photo: PhotoUploadItem,
    options: SinglePhotoUploadOptions = {}
  ): Promise<UploadedMediaItemResult> {
    const maxRetries = options.maxRetries ?? 3;
    const initialRetryDelay = options.initialRetryDelayMs ?? 500;

    // Step 1: Client-side optimization (bounded resize + compress + cache check)
    const optimized: OptimizedImageResult = await optimizeListingImage(
      photo.uri,
      photo.fileName,
      photo.mimeType
    );

    if (options.signal?.aborted) {
      throw new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED');
    }

    let attempt = 0;
    while (true) {
      if (options.signal?.aborted) {
        throw new ApiError('Upload cancelled by user', 0, 'UPLOAD_ABORTED');
      }

      try {
        // Step 2: Request signed upload signature from backend
        const signedParams = await this.requestUploadSignature(
          listingId,
          {
            fileName: optimized.fileName,
            fileType: optimized.mimeType,
            fileSizeBytes: optimized.fileSizeBytes,
          },
          options.signal
        );

        // Step 3: Direct upload to Cloudinary
        const uploadResult = await this.uploadDirectToCloudinary(
          signedParams,
          optimized.uri,
          optimized.fileName,
          optimized.mimeType,
          {
            timeoutMs: options.timeoutMs,
            signal: options.signal,
            onProgress: options.onProgress,
          }
        );

        // Step 4: Attach media record to listing in PostgreSQL
        const attached = await this.attachMediaToListing(
          listingId,
          {
            type: 'IMAGE',
            storageKey: uploadResult.publicId,
            thumbnailKey: uploadResult.secureUrl,
            displayOrder: options.displayOrder ?? 0,
            provider: 'cloudinary',
          },
          options.signal
        );

        return attached;
      } catch (err: any) {
        attempt++;
        const isTransient = isTransientError(err);
        const canRetry = isTransient && attempt <= maxRetries && !options.signal?.aborted;

        logger.warn(
          `[ListingUpload] Upload attempt ${attempt}/${maxRetries + 1} failed: ${err.message}`,
          { isTransient, canRetry, listingId }
        );

        if (!canRetry) {
          throw err;
        }

        const backoffMs = Math.min(initialRetryDelay * Math.pow(2, attempt - 1), 5000);
        await delay(backoffMs);
      }
    }
  }

  /**
   * Upload multiple listing photos in parallel with a bounded concurrency pool.
   */
  public async uploadPhotosBatch(
    listingId: string,
    photos: PhotoUploadItem[],
    options: BatchUploadOptions = {}
  ): Promise<UploadedMediaItemResult[]> {
    if (!photos || photos.length === 0) return [];

    const concurrencyLimit = Math.max(1, Math.min(6, options.concurrencyLimit ?? 3));
    const totalCount = photos.length;
    const results: UploadedMediaItemResult[] = new Array(totalCount);
    const progressMap = new Array<number>(totalCount).fill(0);
    const successfullyAttachedIds: string[] = [];

    let completedCount = 0;
    let failedCount = 0;
    let inProgressCount = 0;
    let nextIndexToPick = 0;
    let abortSignalTriggered = false;

    const updateOverallProgress = () => {
      const sumPercent = progressMap.reduce((acc, p) => acc + p, 0);
      const overallPercent = Math.min(100, Math.round(sumPercent / totalCount));
      options.onOverallProgress?.({
        completedCount,
        totalCount,
        overallPercent,
        inProgressCount,
        failedCount,
      });
    };

    const worker = async () => {
      while (nextIndexToPick < totalCount) {
        if (options.signal?.aborted || abortSignalTriggered) {
          throw new ApiError('Batch upload cancelled by user', 0, 'UPLOAD_ABORTED');
        }

        const currentIndex = nextIndexToPick++;
        const photo = photos[currentIndex];

        inProgressCount++;
        updateOverallProgress();

        try {
          const itemResult = await this.uploadSinglePhoto(listingId, photo, {
            displayOrder: currentIndex,
            timeoutMs: options.timeoutMs,
            maxRetries: options.maxRetries,
            signal: options.signal,
            onProgress: (percent, loaded, total) => {
              progressMap[currentIndex] = percent;
              options.onFileProgress?.(currentIndex, percent, loaded, total);
              updateOverallProgress();
            },
          });

          results[currentIndex] = itemResult;
          successfullyAttachedIds.push(itemResult.id);
          progressMap[currentIndex] = 100;
          completedCount++;
        } catch (itemErr: any) {
          failedCount++;
          if (itemErr.name === 'AbortError' || itemErr.code === 'UPLOAD_ABORTED' || options.signal?.aborted) {
            abortSignalTriggered = true;
            throw itemErr;
          }
          throw itemErr;
        } finally {
          inProgressCount--;
          updateOverallProgress();
        }
      }
    };

    // Run workers up to concurrency limit
    const workerPromises = Array.from({ length: Math.min(concurrencyLimit, totalCount) }, () =>
      worker()
    );

    try {
      await Promise.all(workerPromises);
      return results;
    } catch (batchErr: any) {
      logger.error('[ListingUpload] Batch upload encountered error or was aborted', {
        err: batchErr?.message,
        completedCount,
        failedCount,
      });

      // Cleanup newly created media on unrecoverable abort/failure if requested
      if (options.cleanupOnFailure && successfullyAttachedIds.length > 0) {
        logger.info('[ListingUpload] Cleaning up partially attached media assets...');
        const token = await tokenStorage.getAccessToken();
        for (const mediaId of successfullyAttachedIds) {
          try {
            await fetch(`${env.API_BASE_URL}/listings/${listingId}/media/${mediaId}`, {
              method: 'DELETE',
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
          } catch (delErr) {
            logger.warn('[ListingUpload] Could not clean up media asset', { mediaId, delErr });
          }
        }
      }

      throw batchErr;
    }
  }
}

export const listingUploadService = new ListingUploadService();

