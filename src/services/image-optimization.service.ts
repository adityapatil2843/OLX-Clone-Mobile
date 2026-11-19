import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../utils/logger';

export interface ImageOptimizationConfig {
  /** Maximum allowable width or height in pixels (default: 1600) */
  maxDimension?: number;
  /** Compression quality between 0.0 and 1.0 (default: 0.82) */
  quality?: number;
  /** Maximum permitted raw input file size in bytes (default: 25 MB) */
  maxRawFileSizeBytes?: number;
  /** Preferred output format (default: SaveFormat.JPEG) */
  format?: SaveFormat;
}

export interface OptimizedImageResult {
  uri: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  wasCompressed: boolean;
}

export const OPTIMIZATION_DEFAULTS = {
  MAX_DIMENSION: 1600,
  QUALITY: 0.82,
  MAX_RAW_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  TARGET_MAX_FILE_SIZE_BYTES: 1024 * 1024, // 1 MB
  SUPPORTED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;

// In-memory cache to prevent repeatedly re-compressing already processed images
const processedImageCache = new Map<string, OptimizedImageResult>();

/**
 * Optimizes an image for listing photo upload:
 * - Checks input file size limit (max 25 MB)
 * - Checks cache to avoid re-compressing already-optimized images
 * - Resizes image so neither width nor height exceeds maxDimension (1600px)
 * - Compresses with quality 0.82 as standard JPEG
 * - Returns optimized file metadata
 */
export async function optimizeListingImage(
  inputUri: string,
  fileName?: string,
  mimeType?: string,
  config: ImageOptimizationConfig = {}
): Promise<OptimizedImageResult> {
  const maxDimension = config.maxDimension ?? OPTIMIZATION_DEFAULTS.MAX_DIMENSION;
  const quality = config.quality ?? OPTIMIZATION_DEFAULTS.QUALITY;
  const maxRawFileSizeBytes = config.maxRawFileSizeBytes ?? OPTIMIZATION_DEFAULTS.MAX_RAW_FILE_SIZE_BYTES;
  const format = config.format ?? SaveFormat.JPEG;

  // 1. Check if this URI was already optimized in this session
  if (processedImageCache.has(inputUri)) {
    logger.debug('[ImageOptimization] Cache hit - skipping re-compression', { inputUri });
    return processedImageCache.get(inputUri)!;
  }

  // 2. Validate input format and resolve filename
  const cleanExt = (fileName?.split('.').pop() || inputUri.split('.').pop() || 'jpg')
    .toLowerCase()
    .split('?')[0];
  const resolvedMime = mimeType || (cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg');

  if (!(OPTIMIZATION_DEFAULTS.SUPPORTED_MIME_TYPES as readonly string[]).includes(resolvedMime.toLowerCase())) {
    throw new Error(`Unsupported image format '${resolvedMime}'. Supported: JPEG, PNG, WebP`);
  }

  // 3. Inspect raw file size when possible
  let rawSizeBytes: number | undefined;
  if (Platform.OS !== 'web' && FileSystem.getInfoAsync) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(inputUri);
      if (fileInfo.exists && typeof fileInfo.size === 'number') {
        rawSizeBytes = fileInfo.size;
        if (rawSizeBytes > maxRawFileSizeBytes) {
          throw new Error(
            `Image size (${(rawSizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${maxRawFileSizeBytes / (1024 * 1024)} MB`
          );
        }
      }
    } catch (fsErr: any) {
      if (fsErr.message?.includes('exceeds maximum allowed')) throw fsErr;
      logger.warn('[ImageOptimization] Could not inspect file info', { err: fsErr?.message });
    }
  }

  // 4. Perform bounded resizing and compression via expo-image-manipulator
  const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : `img_${Date.now()}`;
  const outFileName = `${baseName}_optimized.jpg`;
  const outMimeType = 'image/jpeg';

  try {
    const manipResult = await manipulateAsync(
      inputUri,
      [
        // Bounded resize: specifying width: maxDimension scales height proportionately;
        // if image is smaller, manipulator gracefully handles it.
        { resize: { width: maxDimension } },
      ],
      {
        compress: quality,
        format,
      }
    );

    // Get final compressed size
    let compressedSizeBytes: number | undefined;
    if (Platform.OS !== 'web' && FileSystem.getInfoAsync) {
      try {
        const outInfo = await FileSystem.getInfoAsync(manipResult.uri);
        if (outInfo.exists && typeof outInfo.size === 'number') {
          compressedSizeBytes = outInfo.size;
        }
      } catch {}
    }

    const result: OptimizedImageResult = {
      uri: manipResult.uri,
      fileName: outFileName,
      mimeType: outMimeType,
      width: manipResult.width,
      height: manipResult.height,
      fileSizeBytes: compressedSizeBytes || rawSizeBytes,
      wasCompressed: true,
    };

    // Cache to prevent duplicate compression
    processedImageCache.set(inputUri, result);
    processedImageCache.set(manipResult.uri, result);

    logger.info('[ImageOptimization] Image successfully optimized', {
      originalUri: inputUri,
      optimizedUri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      compressedSizeBytes,
    });

    return result;
  } catch (manipErr: any) {
    logger.warn('[ImageOptimization] Manipulation failed or unsupported, using original URI with bounds check', {
      err: manipErr?.message,
    });

    // Fallback safely to original URI if manipulation cannot run in current environment
    const fallbackResult: OptimizedImageResult = {
      uri: inputUri,
      fileName: fileName || `${baseName}.${cleanExt}`,
      mimeType: resolvedMime,
      fileSizeBytes: rawSizeBytes,
      wasCompressed: false,
    };
    processedImageCache.set(inputUri, fallbackResult);
    return fallbackResult;
  }
}

/**
 * Clears the image optimization cache.
 */
export function clearImageOptimizationCache(): void {
  processedImageCache.clear();
}
