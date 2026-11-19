import { mediaService } from '../src/services/media.service';
import { uploadSessionStorage } from '../src/services/upload-session.storage';

describe('mediaService — Upload Progress Calculation', () => {
  let originalXHR: any;
  let mockXHRInstances: any[] = [];

  beforeEach(() => {
    mockXHRInstances = [];
    originalXHR = (global as any).XMLHttpRequest;

    (global as any).XMLHttpRequest = jest.fn().mockImplementation(() => {
      const instance = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        upload: {
          onprogress: null as any,
        },
        onload: null as any,
        onerror: null as any,
        ontimeout: null as any,
        status: 200,
        responseText: JSON.stringify({
          public_id: 'test-public-id',
          secure_url: 'https://res.cloudinary.com/test.mp4',
        }),
      };
      mockXHRInstances.push(instance);
      return instance;
    });

    jest.spyOn(mediaService, 'requestUploadUrl').mockResolvedValue({
      uploadUrl: 'https://api.cloudinary.com/v1_1/test/video/upload',
      apiKey: 'test-key',
      timestamp: 123456789,
      signature: 'test-sig',
      folder: 'reels/usr-1',
      publicId: 'reels/usr-1/reel-1',
      uploadToken: 'token-123',
    });
  });

  afterEach(() => {
    (global as any).XMLHttpRequest = originalXHR;
    jest.restoreAllMocks();
  });

  const getXHR = async () => {
    for (let i = 0; i < 50; i++) {
      if (mockXHRInstances.length > 0) return mockXHRInstances[0];
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error('XHR was not instantiated');
  };

  it('clamps progress strictly between 0% and 100% when onprogress reports normal values', async () => {
    const progressSpy = jest.fn();

    const uploadPromise = mediaService.uploadReelMedia('reel-1', 'file:///test.mp4', {
      onProgress: progressSpy,
    });

    const xhr = await getXHR();
    expect(xhr).toBeDefined();

    // Normal 50%
    xhr.upload.onprogress({
      lengthComputable: true,
      loaded: 500,
      total: 1000,
    });
    expect(progressSpy).toHaveBeenLastCalledWith(50, 500, 1000);

    // Normal 100%
    xhr.upload.onprogress({
      lengthComputable: true,
      loaded: 1000,
      total: 1000,
    });
    expect(progressSpy).toHaveBeenLastCalledWith(100, 1000, 1000);

    xhr.onload();
    await uploadPromise;
  });

  it('never reports values above 100% when multipart envelope loaded exceeds total', async () => {
    const progressSpy = jest.fn();

    const uploadPromise = mediaService.uploadReelMedia('reel-1', 'file:///test.mp4', {
      onProgress: progressSpy,
    });

    const xhr = await getXHR();
    expect(xhr).toBeDefined();

    // Overshoot: loaded = 1200, total = 1000 (e.g. 120%)
    xhr.upload.onprogress({
      lengthComputable: true,
      loaded: 1200,
      total: 1000,
    });

    // Strictly clamped to 100%
    expect(progressSpy).toHaveBeenLastCalledWith(100, 1000, 1000);

    xhr.onload();
    await uploadPromise;
  });

  it('safely ignores non-finite, NaN or invalid progress events', async () => {
    const progressSpy = jest.fn();

    const uploadPromise = mediaService.uploadReelMedia('reel-1', 'file:///test.mp4', {
      onProgress: progressSpy,
    });

    const xhr = await getXHR();
    expect(xhr).toBeDefined();

    // Total is 0
    xhr.upload.onprogress({
      lengthComputable: true,
      loaded: 100,
      total: 0,
    });
    expect(progressSpy).not.toHaveBeenCalled();

    // NaN loaded
    xhr.upload.onprogress({
      lengthComputable: true,
      loaded: NaN,
      total: 1000,
    });
    expect(progressSpy).not.toHaveBeenCalled();

    xhr.onload();
    await uploadPromise;
  });

  it('sets Content-Range and X-Unique-Upload-Id headers for chunked upload', async () => {
    const uploadPromise = mediaService.uploadReelMedia('reel-headers-test', 'file:///test.mp4', {
      fileSizeBytes: 5242880,
    });

    const xhr = await getXHR();
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Unique-Upload-Id', expect.stringContaining('sess_reelheaderstest_'));
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Range', expect.stringMatching(/bytes \d+-\d+\/\d+/));

    xhr.onload();
    await uploadPromise;
  });

  it('resumes from existing confirmed offset saved in uploadSessionStorage', async () => {
    await uploadSessionStorage.saveUploadSession({
      reelId: 'reel-resume-test',
      videoUri: 'file:///resume-test.mp4',
      uploadUrl: 'https://api.cloudinary.com/v1_1/test/video/upload',
      uploadSessionId: 'sess_persisted_123',
      publicId: 'reels/usr-1/reel-resume-test',
      confirmedOffset: 2000000,
      totalBytes: 5242880,
      signedParams: {
        uploadUrl: 'https://api.cloudinary.com/v1_1/test/video/upload',
        apiKey: 'test-key',
        timestamp: 123456789,
        signature: 'test-sig',
        folder: 'reels/usr-1',
        publicId: 'reels/usr-1/reel-resume-test',
      },
      updatedAt: Date.now(),
    });

    const uploadPromise = mediaService.uploadReelMedia('reel-resume-test', 'file:///resume-test.mp4', {
      fileSizeBytes: 5242880,
    });

    const xhr = await getXHR();
    // Resumes using persisted session ID and from offset 2000000
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-Unique-Upload-Id', 'sess_persisted_123');
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Range', 'bytes 2000000-5242879/5242880');

    xhr.onload();
    const result = await uploadPromise;
    expect(result.id).toBe('reel-resume-test');

    // Storage is cleared on completion
    const cleared = await uploadSessionStorage.getUploadSession('reel-resume-test');
    expect(cleared).toBeNull();
  });
});
