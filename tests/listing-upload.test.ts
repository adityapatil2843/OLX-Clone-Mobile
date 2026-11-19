import {
  optimizeListingImage,
  clearImageOptimizationCache,
  OPTIMIZATION_DEFAULTS,
} from '../src/services/image-optimization.service';
import {
  listingUploadService,
  isTransientError,
} from '../src/services/listing-upload.service';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockImplementation(async (uri: string, actions: any[], saveOptions: any) => ({
    uri: `${uri}_manipulated.jpg`,
    width: actions[0]?.resize?.width || 1600,
    height: 1200,
  })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
}));

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockImplementation(async (uri: string) => ({
    exists: true,
    size: uri.includes('oversized') ? 30 * 1024 * 1024 : 1.5 * 1024 * 1024,
    isDirectory: false,
    uri,
  })),
}));

// Mock token-storage
jest.mock('../src/services/token-storage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
  },
}));

describe('Listing Photo Upload Optimization & Direct Upload Manager', () => {
  beforeEach(() => {
    clearImageOptimizationCache();
    jest.clearAllMocks();
  });

  describe('Image Optimization Service', () => {
    it('optimizes valid image within bounded dimensions and quality', async () => {
      const result = await optimizeListingImage('file:///photos/car_front.jpg', 'car_front.jpg', 'image/jpeg');

      expect(result.uri).toContain('_manipulated.jpg');
      expect(result.fileName).toBe('car_front_optimized.jpg');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.width).toBeLessThanOrEqual(OPTIMIZATION_DEFAULTS.MAX_DIMENSION);
      expect(result.wasCompressed).toBe(true);
    });

    it('idempotently caches already-optimized images avoiding duplicate compression', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');

      const firstCall = await optimizeListingImage('file:///photos/car_rear.jpg', 'car_rear.jpg', 'image/jpeg');
      expect(manipulateAsync).toHaveBeenCalledTimes(1);

      // Second call with same URI must hit cache
      const secondCall = await optimizeListingImage('file:///photos/car_rear.jpg', 'car_rear.jpg', 'image/jpeg');
      expect(manipulateAsync).toHaveBeenCalledTimes(1);
      expect(secondCall.uri).toBe(firstCall.uri);
    });

    it('rejects unsupported file formats', async () => {
      await expect(
        optimizeListingImage('file:///docs/contract.pdf', 'contract.pdf', 'application/pdf')
      ).rejects.toThrow(/Unsupported image format/);
    });

    it('rejects oversized raw image files exceeding maximum limit', async () => {
      await expect(
        optimizeListingImage('file:///photos/oversized_camera_raw.jpg', 'oversized_camera_raw.jpg', 'image/jpeg')
      ).rejects.toThrow(/exceeds maximum allowed limit/);
    });
  });

  describe('Transient Error Classification', () => {
    it('classifies network, timeout, and 5xx errors as transient', () => {
      expect(isTransientError({ statusCode: 500, message: 'Internal Server Error' })).toBe(true);
      expect(isTransientError({ statusCode: 502, message: 'Bad Gateway' })).toBe(true);
      expect(isTransientError({ statusCode: 503, message: 'Service Unavailable' })).toBe(true);
      expect(isTransientError({ statusCode: 408, message: 'Request Timeout' })).toBe(true);
      expect(isTransientError({ statusCode: 429, message: 'Too Many Requests' })).toBe(true);
      expect(isTransientError(new Error('Network request failed'))).toBe(true);
      expect(isTransientError(new Error('ECONNRESET: Connection reset by peer'))).toBe(true);
    });

    it('classifies permanent 4xx and user cancellations as non-transient', () => {
      expect(isTransientError({ statusCode: 400, message: 'Bad Request' })).toBe(false);
      expect(isTransientError({ statusCode: 401, message: 'Unauthorized' })).toBe(false);
      expect(isTransientError({ statusCode: 403, message: 'Forbidden' })).toBe(false);
      expect(isTransientError({ statusCode: 404, message: 'Not Found' })).toBe(false);
      expect(isTransientError({ statusCode: 422, message: 'Unprocessable Entity' })).toBe(false);
      expect(isTransientError({ name: 'AbortError', message: 'The user aborted a request' })).toBe(false);
    });
  });

  describe('Single Photo Upload Flow & Retries', () => {
    it('successfully uploads photo and attaches to listing', async () => {
      const mockSignature = {
        uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
        apiKey: '123456789',
        timestamp: 1700000000,
        signature: 'mock_sig',
        folder: 'listings/user1/listing1',
        publicId: 'listings/user1/listing1/photo1',
        resourceType: 'image',
      };

      jest.spyOn(listingUploadService, 'requestUploadSignature').mockResolvedValue(mockSignature);
      jest.spyOn(listingUploadService, 'uploadDirectToCloudinary').mockResolvedValue({
        publicId: mockSignature.publicId,
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/photo1.jpg',
      });
      jest.spyOn(listingUploadService, 'attachMediaToListing').mockResolvedValue({
        id: 'media-001',
        listingId: 'listing-123',
        type: 'IMAGE',
        storageKey: mockSignature.publicId,
        provider: 'cloudinary',
        thumbnailKey: 'https://res.cloudinary.com/demo/image/upload/photo1.jpg',
        displayOrder: 0,
      });

      const result = await listingUploadService.uploadSinglePhoto('listing-123', {
        uri: 'file:///photos/bike.jpg',
        fileName: 'bike.jpg',
        mimeType: 'image/jpeg',
      });

      expect(result.id).toBe('media-001');
      expect(result.storageKey).toBe(mockSignature.publicId);
      expect(listingUploadService.requestUploadSignature).toHaveBeenCalledWith(
        'listing-123',
        expect.objectContaining({ fileType: 'image/jpeg' }),
        undefined
      );
      expect(listingUploadService.attachMediaToListing).toHaveBeenCalledWith(
        'listing-123',
        expect.objectContaining({ storageKey: mockSignature.publicId }),
        undefined
      );
    });

    it('retries transient failures up to maximum retry limit', async () => {
      const mockSignature = {
        uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
        apiKey: '123456789',
        timestamp: 1700000000,
        signature: 'mock_sig',
        folder: 'listings/user1/listing1',
        publicId: 'listings/user1/listing1/photo1',
        resourceType: 'image',
      };

      jest.spyOn(listingUploadService, 'requestUploadSignature').mockResolvedValue(mockSignature);

      // Fail twice with transient network error, succeed on 3rd attempt
      let attempts = 0;
      jest.spyOn(listingUploadService, 'uploadDirectToCloudinary').mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          const err: any = new Error('Network timeout');
          err.statusCode = 504;
          throw err;
        }
        return {
          publicId: mockSignature.publicId,
          secureUrl: 'https://res.cloudinary.com/photo1.jpg',
        };
      });

      jest.spyOn(listingUploadService, 'attachMediaToListing').mockResolvedValue({
        id: 'media-retry',
        listingId: 'listing-retry',
        type: 'IMAGE',
        storageKey: mockSignature.publicId,
        provider: 'cloudinary',
        displayOrder: 0,
      });

      const result = await listingUploadService.uploadSinglePhoto(
        'listing-retry',
        { uri: 'file:///photos/retry.jpg' },
        { maxRetries: 3, initialRetryDelayMs: 10 }
      );

      expect(result.id).toBe('media-retry');
      expect(attempts).toBe(3);
    });

    it('aborts immediately and throws when AbortSignal is cancelled', async () => {
      const abortController = new AbortController();
      abortController.abort(); // already aborted

      await expect(
        listingUploadService.uploadSinglePhoto(
          'listing-abort',
          { uri: 'file:///photos/cancel.jpg' },
          { signal: abortController.signal }
        )
      ).rejects.toThrow(/cancelled by user/);
    });
  });

  describe('Bounded Concurrency Batch Upload', () => {
    it('processes batch uploads with bounded concurrency and tracks overall progress', async () => {
      let activeConcurrency = 0;
      let maxObservedConcurrency = 0;

      jest.spyOn(listingUploadService, 'uploadSinglePhoto').mockImplementation(async (_id, photo, options) => {
        activeConcurrency++;
        maxObservedConcurrency = Math.max(maxObservedConcurrency, activeConcurrency);

        // Simulate async upload transfer
        options?.onProgress?.(50, 500, 1000);
        await new Promise((r) => setTimeout(r, 20));
        options?.onProgress?.(100, 1000, 1000);

        activeConcurrency--;
        return {
          id: `media-${photo.uri}`,
          listingId: 'listing-batch',
          type: 'IMAGE',
          storageKey: `key-${photo.uri}`,
          provider: 'cloudinary',
          displayOrder: 0,
        };
      });

      const progressUpdates: any[] = [];
      const testPhotos = Array.from({ length: 6 }, (_, i) => ({
        uri: `file:///photos/photo_${i + 1}.jpg`,
      }));

      const results = await listingUploadService.uploadPhotosBatch('listing-batch', testPhotos, {
        concurrencyLimit: 3,
        onOverallProgress: (p) => progressUpdates.push({ ...p }),
      });

      expect(results.length).toBe(6);
      expect(maxObservedConcurrency).toBeLessThanOrEqual(3);
      expect(progressUpdates.length).toBeGreaterThan(0);
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.completedCount).toBe(6);
      expect(finalProgress.overallPercent).toBe(100);
    });
  });
});

