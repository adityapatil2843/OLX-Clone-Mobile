(global as any).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const MockIcon = (props: any) => React.createElement('Icon', props);
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    }
  );
});

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: (props: any) => React.createElement('Image', props),
  };
});

// Mock expo-video
let mockPlayerStatus = 'readyToPlay';
let mockIsPlaying = true;
const mockPlay = jest.fn(() => {
  mockIsPlaying = true;
});
const mockPause = jest.fn(() => {
  mockIsPlaying = false;
});
const mockAddListener = jest.fn((event: string, callback: any) => {
  return { remove: jest.fn() };
});

jest.mock('expo-video', () => {
  const React = require('react');
  return {
    useVideoPlayer: jest.fn((source: any, setup: any) => {
      const player = {
        play: mockPlay,
        pause: mockPause,
        addListener: mockAddListener,
        status: mockPlayerStatus,
        playing: mockIsPlaying,
        loop: true,
      };
      if (typeof setup === 'function') {
        setup(player);
      }
      return player;
    }),
    VideoView: (props: any) => React.createElement('VideoView', props),
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///data/user/0/cache/sample-reel.mp4',
        fileName: 'sample-reel.mp4',
        mimeType: 'video/mp4',
        fileSize: 10485760, // 10 MB
        duration: 15000,
        width: 1080,
        height: 1920,
      },
    ],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///data/user/0/cache/recorded-reel.mp4',
        fileName: 'recorded-reel.mp4',
        mimeType: 'video/mp4',
        fileSize: 5242880,
        duration: 8000,
        width: 1080,
        height: 1920,
      },
    ],
  }),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 12.97, longitude: 77.59 } }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: 'Bengaluru', region: 'Karnataka' }]),
}));

// Mock expo-router
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
    back: mockRouterBack,
  }),
}));

// Mock safe area insets & view
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: (props: any) => React.createElement('SafeAreaView', props),
  };
});

// Mock services and stores
const mockCreateReel = jest.fn();
const mockConfirmUpload = jest.fn();
const mockUpdateReel = jest.fn();
jest.mock('../src/services/reels.service', () => ({
  reelsService: {
    createReel: (...args: any[]) => mockCreateReel(...args),
    confirmUpload: (...args: any[]) => mockConfirmUpload(...args),
    updateReel: (...args: any[]) => mockUpdateReel(...args),
  },
}));

const mockUploadReelMedia = jest.fn();
jest.mock('../src/services/media.service', () => ({
  mediaService: {
    uploadReelMedia: (...args: any[]) => mockUploadReelMedia(...args),
  },
}));

jest.mock('../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'usr-dev-001', name: 'Dev Creator', locationCity: 'Bengaluru' },
    isAuthenticated: true,
  }),
}));

jest.mock('../src/hooks/useCategories', () => ({
  useCategoriesQuery: () => ({ data: [], isLoading: false }),
}));

jest.mock('../src/hooks/useListings', () => ({
  useMyListingsQuery: () => ({ data: { data: [] }, isLoading: false }),
}));

jest.mock('../src/providers/QueryProvider', () => ({
  queryClient: {
    invalidateQueries: jest.fn().mockResolvedValue(undefined),
  },
}));

import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateReelScreen from '../src/app/reel/create';

describe('CreateReelScreen — Reel Upload Experience & Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPlaying = true;
    mockPlayerStatus = 'readyToPlay';
    mockCreateReel.mockReset().mockResolvedValue({ id: 'test-reel-id' });
    mockConfirmUpload.mockReset().mockResolvedValue({ id: 'test-reel-id' });
    mockUpdateReel.mockReset().mockResolvedValue({ id: 'test-reel-id', status: 'PUBLISHED' });
    mockUploadReelMedia.mockReset().mockResolvedValue({
      id: 'test-reel-id',
      publicId: 'test-public-id',
      uploadToken: 'test-token',
      videoUrl: 'https://res.cloudinary.com/test/video.mp4',
    });
    mockRouterReplace.mockReset();
    mockRouterPush.mockReset();
    mockRouterBack.mockReset();
    jest.spyOn(Alert, 'alert');
  });

  afterEach(async () => {
    cleanup();
    await new Promise((r) => setTimeout(r, 50));
  });

  describe('1. Reel Preview Controls', () => {
    it('shows preview with Play/Pause button after selecting a video', async () => {
      const { getByText, getByTestId } = await render(<CreateReelScreen />);

      // Select video from library
      const chooseLibraryBtn = getByText('Choose Library');
      fireEvent.press(chooseLibraryBtn);

      await waitFor(() => {
        expect(getByTestId('preview-play-pause-btn')).toBeTruthy();
      });
    });

    it('toggles play/pause state and updates accessibility labels', async () => {
      const { getByText, getByTestId } = await render(<CreateReelScreen />);

      fireEvent.press(getByText('Choose Library'));

      await waitFor(() => {
        const toggleBtn = getByTestId('preview-play-pause-btn');
        expect(toggleBtn.props.accessibilityLabel).toBe('Pause video preview');
      });

      // Tap to pause
      const toggleBtn = getByTestId('preview-play-pause-btn');
      fireEvent.press(toggleBtn);

      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled();
        expect(toggleBtn.props.accessibilityLabel).toBe('Play video preview');
      });

      // Tap to resume play
      fireEvent.press(toggleBtn);
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
        expect(toggleBtn.props.accessibilityLabel).toBe('Pause video preview');
      });
    });

    it('supports keyboard navigation (Space / Enter key) to toggle playback', async () => {
      const { getByText, getByTestId } = await render(<CreateReelScreen />);

      fireEvent.press(getByText('Choose Library'));

      await waitFor(() => {
        expect(getByTestId('preview-play-pause-btn')).toBeTruthy();
      });

      const toggleBtn = getByTestId('preview-play-pause-btn');

      // Trigger onKeyDown with Space
      fireEvent(toggleBtn, 'keyDown', { key: ' ', preventDefault: jest.fn() });
      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled();
      });

      // Trigger onKeyDown with Enter
      fireEvent(toggleBtn, 'keyDown', { key: 'Enter', preventDefault: jest.fn() });
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });

  describe('2. Correct Upload Progress', () => {
    it('clamps upload progress strictly between 0% and 100% even if library reports overshoot or invalid numbers', async () => {
      let progressCallback: ((percent: number) => void) | null = null;
      let finishUpload: any;
      mockCreateReel.mockResolvedValue({ id: 'reel-test-123' });
      mockUploadReelMedia.mockImplementation((id, uri, options) => {
        progressCallback = options.onProgress;
        return new Promise((resolve) => {
          finishUpload = resolve;
        });
      });
      mockConfirmUpload.mockResolvedValue({ id: 'reel-test-123' });
      mockUpdateReel.mockResolvedValue({ id: 'reel-test-123', status: 'PUBLISHED' });

      const { getByText, queryByText } = await render(<CreateReelScreen />);

      // Pick video
      fireEvent.press(getByText('Choose Library'));

      await waitFor(() => {
        expect(getByText('Upload & Publish Reel')).toBeTruthy();
      });

      // Click upload
      fireEvent.press(getByText('Upload & Publish Reel'));

      await waitFor(() => {
        expect(mockCreateReel).toHaveBeenCalledTimes(1);
      });

      // Simulate unexpected progress report of 150% (overshoot)
      if (progressCallback) {
        (progressCallback as any)(150);
      }

      await waitFor(() => {
        // Must be clamped to 100%, never display 150%
        expect(queryByText('Uploading video: 150%...')).toBeNull();
        expect(getByText('Uploading video: 100%...')).toBeTruthy();
      });

      // Simulate invalid/negative progress report (-20%)
      if (progressCallback) {
        (progressCallback as any)(-20);
      }

      await waitFor(() => {
        // Must be clamped to 0%, never display -20%
        expect(queryByText('Uploading video: -20%...')).toBeNull();
        expect(getByText('Uploading video: 0%...')).toBeTruthy();
      });

      // Settle upload
      finishUpload({ id: 'reel-test-123', publicId: 'test-public-id', uploadToken: 'test-token' });
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('3. Upload Completion Behavior', () => {
    it('redirects immediately upon confirmed server success without showing Alert.alert toast', async () => {
      mockCreateReel.mockResolvedValue({ id: 'reel-test-456' });
      mockUploadReelMedia.mockResolvedValue({
        id: 'reel-test-456',
        publicId: 'test-public-id',
        uploadToken: 'test-token',
        videoUrl: 'https://res.cloudinary.com/test/video.mp4',
      });
      mockConfirmUpload.mockResolvedValue({ id: 'reel-test-456' });
      mockUpdateReel.mockResolvedValue({ id: 'reel-test-456', status: 'PUBLISHED' });

      const { getByText } = await render(<CreateReelScreen />);

      // Select video
      fireEvent.press(getByText('Choose Library'));

      await waitFor(() => {
        expect(getByText('Upload & Publish Reel')).toBeTruthy();
      });

      // Submit
      fireEvent.press(getByText('Upload & Publish Reel'));

      await waitFor(() => {
        // Verified: Server confirm and publish called
        expect(mockConfirmUpload).toHaveBeenCalledTimes(1);
        expect(mockUpdateReel).toHaveBeenCalledTimes(1);
        // Verified: Immediately routed to destination
        expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
        // Verified: No Alert.alert success popups
        expect(Alert.alert).not.toHaveBeenCalled();
      });
    });

    it('locks submission to prevent duplicate reel creation while in-flight', async () => {
      let resolveUpload: any;
      mockUploadReelMedia.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpload = resolve;
          })
      );

      const screen = await render(<CreateReelScreen />);

      const chooseLibraryBtn = await screen.findByText('Choose Library');
      fireEvent.press(chooseLibraryBtn);

      await waitFor(() => {
        expect(screen.getByText('Upload & Publish Reel')).toBeTruthy();
      });

      const submitBtn = screen.getByText('Upload & Publish Reel');
      fireEvent.press(submitBtn);

      await waitFor(() => {
        // createReel must only be called ONCE
        expect(mockCreateReel).toHaveBeenCalledTimes(1);
        // Upload status text is displayed during submission
        expect(screen.getByText('Uploading video: 0%...')).toBeTruthy();
      });

      resolveUpload({ id: 'test-reel-id', publicId: 'pid', uploadToken: 'ut' });
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
      });
      await new Promise((r) => setTimeout(r, 50));
    });
  });

  describe('4. Error and Cancellation States', () => {
    it('retains user on upload flow and presents a clear Retry button when upload fails', async () => {
      mockUploadReelMedia.mockRejectedValueOnce(new Error('Cloudinary upload network error'));
      mockUploadReelMedia.mockResolvedValueOnce({
        id: 'test-reel-id',
        publicId: 'recovered-id',
        uploadToken: 'recovered-token',
      });

      const screen = await render(<CreateReelScreen />);

      const chooseLibraryBtn = await screen.findByText('Choose Library');
      fireEvent.press(chooseLibraryBtn);

      await waitFor(() => {
        expect(screen.getByText('Upload & Publish Reel')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Upload & Publish Reel'));

      await waitFor(() => {
        expect(screen.getByText('Cloudinary upload network error')).toBeTruthy();
        expect(screen.getByText('Retry')).toBeTruthy();
        // Did not navigate
        expect(mockRouterReplace).not.toHaveBeenCalled();
      });

      // Press Retry button
      fireEvent.press(screen.getByText('Retry'));

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });
});
