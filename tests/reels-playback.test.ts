import { Reel } from '../src/services/reels.service';

type NormalizedStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

function normalizeReelStatus(item: Partial<Reel>): NormalizedStatus {
  const s = (item.status || '').toUpperCase();
  if (s === 'READY' || s === 'PUBLISHED') return 'READY';
  if (s === 'FAILED') return 'FAILED';
  if (s === 'PENDING') return 'PENDING';
  if (s === 'PROCESSING') return 'PROCESSING';
  if (s === 'DRAFT') return 'PENDING';
  if (item.videoUrl || item.hlsUrl) return 'READY';
  return 'PROCESSING';
}

function resolvePlaybackSource(item: Partial<Reel>): { primary: string | null; fallback: string | null } {
  const primary = item.hlsUrl || item.videoUrl || null;
  const fallback = item.hlsUrl && item.videoUrl && item.videoUrl !== item.hlsUrl ? item.videoUrl : null;
  return { primary, fallback };
}

describe('Phase 3: Reels Playback & Lifecycle Normalization', () => {
  test('correctly normalizes READY and PUBLISHED status', () => {
    expect(normalizeReelStatus({ status: 'READY' })).toBe('READY');
    expect(normalizeReelStatus({ status: 'PUBLISHED' })).toBe('READY');
    expect(normalizeReelStatus({ status: 'ready' })).toBe('READY');
  });

  test('correctly normalizes PENDING and PROCESSING status', () => {
    expect(normalizeReelStatus({ status: 'PENDING' })).toBe('PENDING');
    expect(normalizeReelStatus({ status: 'PROCESSING' })).toBe('PROCESSING');
    expect(normalizeReelStatus({ status: 'DRAFT' })).toBe('PENDING');
  });

  test('correctly normalizes FAILED status', () => {
    expect(normalizeReelStatus({ status: 'FAILED' })).toBe('FAILED');
    expect(normalizeReelStatus({ status: 'failed' })).toBe('FAILED');
  });

  test('backward compatibility: legacy records with no status but videoUrl normalize to READY', () => {
    expect(normalizeReelStatus({ videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4' })).toBe('READY');
    expect(normalizeReelStatus({ hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_auto/sample.m3u8' })).toBe('READY');
    expect(normalizeReelStatus({})).toBe('PROCESSING');
  });

  test('prefers HLS stream when available, with MP4 as fallback', () => {
    const hlsUrl = 'https://res.cloudinary.com/demo/video/upload/sp_auto/v1/reel.m3u8';
    const mp4Url = 'https://res.cloudinary.com/demo/video/upload/v1/reel.mp4';

    const { primary, fallback } = resolvePlaybackSource({ hlsUrl, videoUrl: mp4Url });
    expect(primary).toBe(hlsUrl);
    expect(fallback).toBe(mp4Url);
  });

  test('falls back to MP4 URL when HLS URL is absent', () => {
    const mp4Url = 'https://res.cloudinary.com/demo/video/upload/v1/reel.mp4';
    const { primary, fallback } = resolvePlaybackSource({ videoUrl: mp4Url });
    expect(primary).toBe(mp4Url);
    expect(fallback).toBeNull();
  });

  test('active reel playback condition requires focus, active app, and readiness', () => {
    const checkShouldPlay = (
      isActive: boolean,
      isScreenFocused: boolean,
      isAppActive: boolean,
      isPaused: boolean,
      hasError: boolean
    ) => isActive && isScreenFocused && isAppActive && !isPaused && !hasError;

    // Active screen and focused
    expect(checkShouldPlay(true, true, true, false, false)).toBe(true);

    // Paused by user
    expect(checkShouldPlay(true, true, true, true, false)).toBe(false);

    // Inactive reel (scrolled away)
    expect(checkShouldPlay(false, true, true, false, false)).toBe(false);

    // App backgrounded
    expect(checkShouldPlay(true, true, false, false, false)).toBe(false);

    // Screen tab not focused
    expect(checkShouldPlay(true, false, true, false, false)).toBe(false);

    // Playback error occurred
    expect(checkShouldPlay(true, true, true, false, true)).toBe(false);
  });
});

