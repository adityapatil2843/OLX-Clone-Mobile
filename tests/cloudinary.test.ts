import { optimizeCloudinaryUrl } from '../src/utils/cloudinary';

describe('optimizeCloudinaryUrl utility', () => {
  it('returns non-string or falsy input as-is', () => {
    expect(optimizeCloudinaryUrl('')).toBe('');
    expect(optimizeCloudinaryUrl(undefined as any)).toBe(undefined);
    expect(optimizeCloudinaryUrl(null as any)).toBe(null);
  });

  it('leaves non-Cloudinary URLs untouched', () => {
    const s3Url = 'https://my-bucket.s3.amazonaws.com/uploads/photo.jpg';
    expect(optimizeCloudinaryUrl(s3Url)).toBe(s3Url);

    const placeholder = 'https://via.placeholder.com/600x400';
    expect(optimizeCloudinaryUrl(placeholder)).toBe(placeholder);
  });

  it('leaves Cloudinary video streams untouched (.mp4, .m3u8)', () => {
    const videoUrl = 'https://res.cloudinary.com/test-cloud/video/upload/v1700000000/reels/vid_123.mp4';
    expect(optimizeCloudinaryUrl(videoUrl)).toBe(videoUrl);

    const hlsUrl = 'https://res.cloudinary.com/test-cloud/video/upload/sp_auto/v1700000000/reels/vid_123.m3u8';
    expect(optimizeCloudinaryUrl(hlsUrl)).toBe(hlsUrl);
  });

  it('injects f_auto,q_auto into Cloudinary image upload URLs without transformations', () => {
    const rawImage = 'https://res.cloudinary.com/test-cloud/image/upload/v1700000000/products/sample.jpg';
    const optimized = optimizeCloudinaryUrl(rawImage);
    expect(optimized).toBe('https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto/v1700000000/products/sample.jpg');
  });

  it('injects f_auto,q_auto into Cloudinary video thumbnail poster images', () => {
    const rawThumbnail = 'https://res.cloudinary.com/test-cloud/video/upload/v1700000000/reels/reel_123.jpg';
    const optimized = optimizeCloudinaryUrl(rawThumbnail);
    expect(optimized).toBe('https://res.cloudinary.com/test-cloud/video/upload/f_auto,q_auto/v1700000000/reels/reel_123.jpg');
  });

  it('combines f_auto,q_auto with existing transformation segments without duplicating', () => {
    const transformed = 'https://res.cloudinary.com/test-cloud/image/upload/c_fill,w_300,h_300/v1700000000/avatars/user.png';
    const optimized = optimizeCloudinaryUrl(transformed);
    expect(optimized).toBe('https://res.cloudinary.com/test-cloud/image/upload/c_fill,w_300,h_300,f_auto,q_auto/v1700000000/avatars/user.png');

    // Does not duplicate if already present
    const alreadyOptimized = 'https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto,w_200/v1700000000/avatars/user.png';
    expect(optimizeCloudinaryUrl(alreadyOptimized)).toBe(alreadyOptimized);
  });
});

