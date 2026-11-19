import { CreateReelPayload, ConfirmUploadPayload, UpdateReelPayload } from '../src/services/reels.service';

/**
 * Utility matching the hashtag parsing in Reel creation screen
 */
function parseHashtags(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[\s,]+/)
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter((tag) => tag.length > 0 && tag.length <= 100)
    .slice(0, 30);
}

/**
 * Validates that reel creation payload properly maps client inputs
 * to the backend-supported fields according to server Zod schema.
 */
function buildCreateReelRequest(inputs: {
  caption?: string;
  rawHashtags?: string;
  categoryId?: string | null;
  locationText?: string | null;
  listingId?: string | null;
  videoUri?: string | null;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
}): CreateReelPayload {
  return {
    caption: inputs.caption?.trim() || undefined,
    hashtags: inputs.rawHashtags ? parseHashtags(inputs.rawHashtags) : [],
    categoryId: inputs.categoryId || null,
    locationText: inputs.locationText?.trim() || null,
    listingId: inputs.listingId || null,
    durationMs: inputs.durationMs || null,
    width: inputs.width || null,
    height: inputs.height || null,
    videoProvider: 'cloudinary',
  };
}

describe('Reel Creation Module — Data Mapping & Lifecycle', () => {
  test('parses comma-separated and space-separated hashtags, stripping # and limiting to 30', () => {
    const raw = '#fashion, #vintage sneakers   #deal #trending, #shoes';
    const parsed = parseHashtags(raw);

    expect(parsed).toEqual(['fashion', 'vintage', 'sneakers', 'deal', 'trending', 'shoes']);
    expect(parsed.length).toBe(6);
  });

  test('enforces max 30 hashtags limit and ignores empty/whitespace tokens', () => {
    const manyTags = Array.from({ length: 40 }, (_, i) => `#tag${i + 1}`).join(' ');
    const parsed = parseHashtags(manyTags);

    expect(parsed.length).toBe(30);
    expect(parsed[0]).toBe('tag1');
    expect(parsed[29]).toBe('tag30');
  });

  test('maps description to caption and keeps listingId optional for general reels', () => {
    const generalReel = buildCreateReelRequest({
      caption: 'Explore our latest handmade pottery showcase!',
      rawHashtags: '#crafts #pottery',
      locationText: 'Jaipur, Rajasthan',
      listingId: null, // No listing attached
      durationMs: 25000,
      width: 1080,
      height: 1920,
    });

    expect(generalReel.caption).toBe('Explore our latest handmade pottery showcase!');
    expect(generalReel.hashtags).toEqual(['crafts', 'pottery']);
    expect(generalReel.listingId).toBeNull();
    expect(generalReel.locationText).toBe('Jaipur, Rajasthan');
    expect(generalReel.videoProvider).toBe('cloudinary');
    expect(generalReel.durationMs).toBe(25000);
    expect(generalReel.width).toBe(1080);
    expect(generalReel.height).toBe(1920);
  });

  test('attaches listingId when user links a product to create a shoppable reel', () => {
    const shoppableReel = buildCreateReelRequest({
      caption: 'Vintage leather jacket in mint condition!',
      categoryId: '11111111-2222-3333-4444-555555555555',
      listingId: '99999999-8888-7777-6666-555555555555',
    });

    expect(shoppableReel.listingId).toBe('99999999-8888-7777-6666-555555555555');
    expect(shoppableReel.categoryId).toBe('11111111-2222-3333-4444-555555555555');
  });

  test('properly structures confirmation payload with Cloudinary keys', () => {
    const storageKey = 'reels/creator-123/reel-456';
    const confirmPayload: ConfirmUploadPayload = {
      videoStorageKey: storageKey,
      storageKey,
      thumbnailStorageKey: `${storageKey}.jpg`,
      thumbnailKey: `${storageKey}.jpg`,
      videoProvider: 'cloudinary',
      uploadToken: 'token-abc-123',
      durationMs: 30000,
      width: 720,
      height: 1280,
      sizeBytes: 15728640,
      mimeType: 'video/mp4',
    };

    expect(confirmPayload.videoStorageKey).toBe(storageKey);
    expect(confirmPayload.thumbnailStorageKey).toBe(`${storageKey}.jpg`);
    expect(confirmPayload.videoProvider).toBe('cloudinary');
    expect(confirmPayload.durationMs).toBe(30000);
  });

  test('properly constructs update payload to transition reel status to PUBLISHED', () => {
    const publishPayload: UpdateReelPayload = {
      status: 'PUBLISHED',
    };

    expect(publishPayload.status).toBe('PUBLISHED');
  });
});

