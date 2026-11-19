import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image as ExpoImage } from 'expo-image';
import {
  ArrowLeft,
  Camera,
  FileVideo,
  Clapperboard,
  X,
  Play,
  Pause,
  MapPin,
  LocateFixed,
  Tag,
  ShoppingBag,
  Check,
  AlertCircle,
  Lock,
  Upload,
  RefreshCw,
  Clock,
  Maximize2,
  HardDrive,
} from 'lucide-react-native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppButton } from '../../components/ui/AppButton';
import { Badge } from '../../components/ui/Badge';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCategoriesQuery } from '../../hooks/useCategories';
import { useMyListingsQuery } from '../../hooks/useListings';
import { REEL_QUERY_KEYS } from '../../hooks/useReels';
import { reelsService } from '../../services/reels.service';
import { mediaService } from '../../services/media.service';
import { queryClient } from '../../providers/QueryProvider';
import { formatCurrencyINR } from '../../utils/formatters';
import { logger } from '../../utils/logger';

export default function CreateReelScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Categories & user's listings
  const { data: categories, isLoading: isCatLoading } = useCategoriesQuery('flat');
  const { data: myListingsData, isLoading: isListingsLoading } = useMyListingsQuery({ status: 'ACTIVE' });
  const myListings = myListingsData?.data || [];

  // Video State
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<number | undefined>(undefined);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);
  const [videoWidth, setVideoWidth] = useState<number | null>(null);
  const [videoHeight, setVideoHeight] = useState<number | null>(null);

  // Form Fields
  const [caption, setCaption] = useState('');
  const [rawHashtags, setRawHashtags] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [locationText, setLocationText] = useState(
    user?.locationCity && user?.locationState
      ? `${user.locationCity}, ${user.locationState}`
      : user?.locationCity || user?.city || ''
  );
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Player preview state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const isSubmittingRef = useRef(false);
  const isFinishingSubmitRef = useRef(false);
  const activeUploadAbortController = useRef<AbortController | null>(null);
  const uploadedMediaResult = useRef<{ id: string; videoUrl?: string; publicId?: string; uploadToken?: string } | null>(null);

  // Upload-on-select state: idle | uploading | uploaded | failed | cancelled | replaced
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'uploaded' | 'failed' | 'cancelled' | 'replaced'>('idle');
  const [draftReelId, setDraftReelId] = useState<string | null>(null);

  // Submission & Progress State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Video Player for preview
  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    try {
      p.play();
    } catch {
      setIsPlaying(false);
      setIsAutoplayBlocked(true);
    }
  });

  useEffect(() => {
    if (!player) return;

    // Detect if autoplay was blocked by browser policy
    const statusSub = player.addListener('statusChange', (payload: any) => {
      if (payload.status === 'error') {
        setIsPlaying(false);
        setIsAutoplayBlocked(true);
      }
    });

    const playingSub = player.addListener('playingChange', (payload: any) => {
      if (typeof payload.isPlaying === 'boolean') {
        setIsPlaying(payload.isPlaying);
      }
    });

    return () => {
      statusSub?.remove?.();
      playingSub?.remove?.();
    };
  }, [player]);

  useEffect(() => {
    if (!player) return;
    try {
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      setIsPlaying(false);
      setIsAutoplayBlocked(true);
    }
  }, [isPlaying, player]);

  const togglePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      try {
        player.play();
        setIsPlaying(true);
        setIsAutoplayBlocked(false);
      } catch {
        setIsPlaying(false);
        setIsAutoplayBlocked(true);
      }
    }
  };

  const handlePreviewKeyDown = (e: any) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault?.();
      togglePlayPause();
    }
  };

  // Parse hashtags into clean array
  const parsedHashtags = useMemo(() => {
    if (!rawHashtags.trim()) return [];
    return rawHashtags
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#/, '').trim())
      .filter((tag) => tag.length > 0 && tag.length <= 100)
      .slice(0, 30);
  }, [rawHashtags]);

  // Handle Video Picking from Library
  const handlePickVideo = async () => {
    setErrorMsg('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your media library to select a reel video.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        applyPickedVideo(result.assets[0]);
      }
    } catch (err: any) {
      logger.warn('Error launching video library', { err });
      Alert.alert('Error', 'Unable to open media library. Please check device permissions.');
    }
  };

  // Handle Video Recording via Camera
  const handleRecordVideo = async () => {
    setErrorMsg('');
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!cameraPermission.granted || !libraryPermission.granted) {
        Alert.alert(
          'Permissions Required',
          'Camera and media library access are required to record a reel video.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1.0,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        applyPickedVideo(result.assets[0]);
      }
    } catch (err: any) {
      logger.warn('Error recording video', { err });
      Alert.alert('Error', 'Unable to start camera recorder. Please check device permissions.');
    }
  };

  const startUpload = async (
    targetReelId: string,
    uri: string,
    fileName: string | null,
    mimeType: string | null,
    fileSize?: number,
    durationMs?: number | null
  ) => {
    const abortController = new AbortController();
    activeUploadAbortController.current = abortController;
    setUploadState('uploading');
    setUploadStatusText('Uploading video: 0%...');

    try {
      const uploadResult = await mediaService.uploadReelMedia(targetReelId, uri, {
        fileName: fileName || undefined,
        mimeType: mimeType || undefined,
        fileSizeBytes: fileSize,
        durationMs: durationMs || undefined,
        signal: abortController.signal,
        onProgress: (percent) => {
          const safePercent =
            typeof percent === 'number' && Number.isFinite(percent)
              ? Math.max(0, Math.min(100, Math.round(percent)))
              : 0;
          setUploadProgress(safePercent);
          setUploadStatusText(`Uploading video: ${safePercent}%...`);
        },
      });

      uploadedMediaResult.current = uploadResult;
      setUploadState('uploaded');
      setUploadProgress(100);
      setUploadStatusText('Upload complete');

      if (isFinishingSubmitRef.current) {
        await finalizeAndPublish(targetReelId, uploadResult);
      }
    } catch (err: any) {
      if (abortController.signal.aborted || err.name === 'AbortError' || err.code === 'UPLOAD_ABORTED') {
        return;
      }
      logger.warn('Reel background upload failed', { err });
      setUploadState('failed');
      setErrorMsg(err.message || 'Upload failed. Tap Retry to continue.');
      isFinishingSubmitRef.current = false;
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const applyPickedVideo = async (asset: ImagePicker.ImagePickerAsset) => {
    // 500 MB maximum size validation
    const MAX_SIZE_BYTES = 500 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > MAX_SIZE_BYTES) {
      Alert.alert(
        'File Too Large',
        'Video file exceeds the 500 MB limit. Please select a shorter or compressed video.'
      );
      return;
    }

    const guessedExt = asset.uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp4';
    const resolvedName = asset.fileName || asset.uri.split('/').pop() || `reel_${Date.now()}.${guessedExt}`;
    const resolvedMime =
      asset.mimeType ||
      (guessedExt === 'mov'
        ? 'video/quicktime'
        : guessedExt === 'webm'
        ? 'video/webm'
        : 'video/mp4');

    // Calculate duration in milliseconds
    let durationMs: number | null = null;
    if (asset.duration !== null && asset.duration !== undefined) {
      durationMs = asset.duration < 1000 ? Math.round(asset.duration * 1000) : Math.round(asset.duration);
    }

    // Cancel in-flight upload if replacing previous video
    if (activeUploadAbortController.current) {
      activeUploadAbortController.current.abort();
    }
    if (draftReelId) {
      setUploadState('replaced');
      reelsService.cancelUpload(draftReelId).catch(() => {});
    }

    setVideoUri(asset.uri);
    setVideoFileName(resolvedName);
    setVideoMimeType(resolvedMime);
    setVideoFileSize(asset.fileSize);
    setVideoDurationMs(durationMs);
    setVideoWidth(asset.width || null);
    setVideoHeight(asset.height || null);
    setIsPlaying(true);
    setUploadProgress(0);
    setErrorMsg('');

    // Create server draft and immediately start background resumable upload
    try {
      const draft = await reelsService.createReel({
        durationMs: durationMs || undefined,
        width: asset.width || undefined,
        height: asset.height || undefined,
        videoProvider: 'cloudinary',
      });
      setDraftReelId(draft.id);
      startUpload(draft.id, asset.uri, resolvedName, resolvedMime, asset.fileSize, durationMs);
    } catch (draftErr: any) {
      logger.warn('Failed to initialize server draft reel', { draftErr });
      setUploadState('failed');
      setErrorMsg(draftErr.message || 'Failed to initialize reel upload session.');
    }
  };

  const handleRemoveVideo = () => {
    if (activeUploadAbortController.current) {
      activeUploadAbortController.current.abort();
    }
    if (draftReelId) {
      setUploadState('cancelled');
      reelsService.cancelUpload(draftReelId).catch(() => {});
    }
    setDraftReelId(null);
    uploadedMediaResult.current = null;
    isFinishingSubmitRef.current = false;
    setVideoUri(null);
    setVideoFileName(null);
    setVideoMimeType(null);
    setVideoFileSize(undefined);
    setVideoDurationMs(null);
    setVideoWidth(null);
    setVideoHeight(null);
    setUploadProgress(0);
    setUploadStatusText('');
    setUploadState('idle');
  };

  const handleRetryUpload = () => {
    if (draftReelId && videoUri) {
      setErrorMsg('');
      setUploadState('uploading');
      setUploadStatusText('Resuming upload...');
      startUpload(draftReelId, videoUri, videoFileName, videoMimeType, videoFileSize, videoDurationMs);
    } else {
      handleSubmit();
    }
  };

  const finalizeAndPublish = async (
    targetReelId: string,
    uploadResult: { id: string; videoUrl?: string; publicId?: string; uploadToken?: string }
  ) => {
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setUploadStatusText('Finalizing media metadata...');

    try {
      const storageKey =
        uploadResult.videoUrl ||
        uploadResult.publicId ||
        `reels/${user?.id || 'creator'}/${targetReelId}`;
      const thumbnailStorageKey = uploadResult.videoUrl
        ? uploadResult.videoUrl.replace(/\.[^.]+$/, '.jpg')
        : (uploadResult.publicId ? `${uploadResult.publicId}.jpg` : storageKey.replace(/\.[^.]+$/, '.jpg'));

      await reelsService.confirmUpload(targetReelId, {
        videoStorageKey: storageKey,
        storageKey,
        thumbnailStorageKey,
        thumbnailKey: thumbnailStorageKey,
        videoProvider: 'cloudinary',
        uploadToken: uploadResult.uploadToken,
        durationMs: videoDurationMs || null,
        width: videoWidth || null,
        height: videoHeight || null,
        sizeBytes: videoFileSize,
        mimeType: videoMimeType || 'video/mp4',
      });

      setUploadStatusText('Publishing reel...');
      await reelsService.updateReel(targetReelId, {
        caption: caption.trim() || undefined,
        hashtags: parsedHashtags,
        categoryId: categoryId || null,
        locationText: locationText.trim() || null,
        listingId: selectedListingId || null,
        status: 'PUBLISHED',
      });

      await queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
      await queryClient.invalidateQueries({ queryKey: ['reels'] });

      router.replace('/(tabs)');
    } catch (err: any) {
      logger.error('Failed to finalize and publish reel', { err });
      setErrorMsg(err.message || 'Failed to publish reel. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      isFinishingSubmitRef.current = false;
      setUploadStatusText('');
    }
  };

  // Form validation & Publish Reel
  const handleSubmit = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    if (!videoUri) {
      setErrorMsg('Please select or record a video for your reel.');
      return;
    }

    if (caption.length > 2200) {
      setErrorMsg('Description caption cannot exceed 2200 characters.');
      return;
    }

    setErrorMsg('');

    // Case 1: Upload is currently in progress — wait for background upload to complete
    if (uploadState === 'uploading') {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      isFinishingSubmitRef.current = true;
      setUploadStatusText('Finishing upload...');
      return;
    }

    // Case 2: Upload already finished in background — finalize and publish immediately
    if (uploadState === 'uploaded' && draftReelId && uploadedMediaResult.current) {
      await finalizeAndPublish(draftReelId, uploadedMediaResult.current);
      return;
    }

    // Case 3: Upload failed or draft not yet initialized
    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setUploadStatusText('Initializing upload...');
      const draft = await reelsService.createReel({
        durationMs: videoDurationMs || undefined,
        width: videoWidth || undefined,
        height: videoHeight || undefined,
        videoProvider: 'cloudinary',
      });
      setDraftReelId(draft.id);
      isFinishingSubmitRef.current = true;
      await startUpload(draft.id, videoUri, videoFileName, videoMimeType, videoFileSize, videoDurationMs);
    } catch (err: any) {
      logger.error('Failed to initialize and start upload on submit', { err });
      setErrorMsg(err.message || 'Failed to initialize reel upload.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      isFinishingSubmitRef.current = false;
    }
  };

  // Auth Guard
  if (!isAuthenticated) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader
          title="Create Reel"
          onBack={() => router.back()}
          left={<ArrowLeft size={22} color={palette.slate900} />}
        />
        <View style={styles.authPromptContainer}>
          <View style={styles.authLockIcon}>
            <Lock size={38} color={palette.brand500} />
          </View>
          <Text style={styles.authPromptTitle}>Sign in required</Text>
          <Text style={styles.authPromptSubtitle}>
            You must be logged in to create and share video reels on Bazarr 360.
          </Text>
          <AppButton
            title="Sign In to Continue"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            size="lg"
            style={styles.signInBtn}
          />
        </View>
      </ScreenContainer>
    );
  }

  const selectedListing = myListings.find((l) => l.id === selectedListingId);

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title="Create Reel"
        onBack={() => router.back()}
        left={<ArrowLeft size={22} color={palette.slate900} />}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error Banner */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={palette.danger600} style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryUploadBtn}
              onPress={handleRetryUpload}
              disabled={isSubmitting}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry Reel Upload"
            >
              <RefreshCw size={13} color={palette.pureWhite} style={{ marginRight: 4 }} />
              <Text style={styles.retryUploadText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Section 1: Video Selection & Preview ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Clapperboard size={18} color={palette.brand500} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Reel Video</Text>
            <Badge label="UP TO 60S" variant="brand" style={{ marginLeft: 'auto' }} />
          </View>
          <Text style={styles.sectionSubtitle}>
            Record with your camera or select an MP4 / MOV video from your library.
          </Text>

          {videoUri ? (
            <View style={styles.previewContainer}>
              <View style={styles.videoWrapper}>
                <VideoView
                  player={player}
                  style={styles.previewVideo}
                  contentFit="cover"
                  nativeControls={false}
                />
                <TouchableOpacity
                  testID="preview-play-pause-btn"
                  style={styles.playPauseOverlay}
                  activeOpacity={0.7}
                  onPress={togglePlayPause}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pause video preview' : 'Play video preview'}
                  aria-label={isPlaying ? 'Pause video preview' : 'Play video preview'}
                  {...({ onKeyDown: handlePreviewKeyDown } as any)}
                >
                  <View
                    style={[
                      styles.playCircle,
                      isPlaying ? styles.pauseCircleActive : styles.playCirclePaused,
                    ]}
                  >
                    {isPlaying ? (
                      <Pause size={22} color={palette.pureWhite} />
                    ) : (
                      <Play size={24} color={palette.pureWhite} fill={palette.pureWhite} style={{ marginLeft: 2 }} />
                    )}
                  </View>
                  {isAutoplayBlocked && (
                    <View style={styles.autoplayBlockedBadge}>
                      <Text style={styles.autoplayBlockedText}>Autoplay Blocked • Tap to Play</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeVideoBtn}
                  onPress={handleRemoveVideo}
                  disabled={isSubmitting}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected video"
                >
                  <X size={16} color={palette.pureWhite} />
                </TouchableOpacity>
              </View>

              {/* Video Info Badges */}
              <View style={styles.videoMetaRow}>
                {videoDurationMs !== null && (
                  <View style={styles.metaBadge}>
                    <Clock size={12} color={palette.slate700} />
                    <Text style={styles.metaBadgeText}>
                      {Math.round(videoDurationMs / 1000)}s
                    </Text>
                  </View>
                )}
                {videoWidth && videoHeight && (
                  <View style={styles.metaBadge}>
                    <Maximize2 size={12} color={palette.slate700} />
                    <Text style={styles.metaBadgeText}>
                      {videoWidth} × {videoHeight}
                    </Text>
                  </View>
                )}
                {videoFileSize && (
                  <View style={styles.metaBadge}>
                    <HardDrive size={12} color={palette.slate700} />
                    <Text style={styles.metaBadgeText}>
                      {(videoFileSize / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                )}
              </View>

              {/* Replace actions */}
              <View style={styles.replaceActionsRow}>
                <TouchableOpacity
                  style={styles.replaceBtn}
                  onPress={handlePickVideo}
                  disabled={isSubmitting}
                >
                  <FileVideo size={15} color={palette.brand600} style={{ marginRight: 6 }} />
                  <Text style={styles.replaceBtnText}>Choose Another</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.replaceBtn}
                  onPress={handleRecordVideo}
                  disabled={isSubmitting}
                >
                  <Camera size={15} color={palette.brand600} style={{ marginRight: 6 }} />
                  <Text style={styles.replaceBtnText}>Re-record</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.pickerBox}>
              <View style={styles.pickerIconBg}>
                <Clapperboard size={36} color={palette.brand500} />
              </View>
              <Text style={styles.pickerPromptTitle}>Add a video for your reel</Text>
              <Text style={styles.pickerPromptDesc}>
                Vertical 9:16 videos work best. Maximum file size 500 MB.
              </Text>

              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={[styles.pickerActionBtn, styles.pickerActionBtnPrimary]}
                  onPress={handleRecordVideo}
                  activeOpacity={0.8}
                >
                  <Camera size={18} color={palette.pureWhite} style={{ marginRight: 6 }} />
                  <Text style={styles.pickerActionTextPrimary}>Record Video</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pickerActionBtn, styles.pickerActionBtnSecondary]}
                  onPress={handlePickVideo}
                  activeOpacity={0.8}
                >
                  <FileVideo size={18} color={palette.slate800} style={{ marginRight: 6 }} />
                  <Text style={styles.pickerActionTextSecondary}>Choose Library</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Section 2: Description (Caption) ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Description (Caption)</Text>
          <Text style={styles.fieldHelper}>
            Describe what your reel is about. Highlight unique selling points or features.
          </Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder="Write a description or caption for your reel..."
              placeholderTextColor={palette.slate400}
              multiline
              numberOfLines={4}
              maxLength={2200}
              value={caption}
              onChangeText={setCaption}
              editable={!isSubmitting}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.charCountText}>{caption.length} / 2200</Text>
        </View>

        {/* ── Section 3: Hashtags ── */}
        <View style={styles.sectionCard}>
          <View style={styles.labelRowWithIcon}>
            <Tag size={16} color={palette.brand500} style={{ marginRight: 6 }} />
            <Text style={styles.fieldLabel}>Hashtags (Optional)</Text>
          </View>
          <Text style={styles.fieldHelper}>
            Add up to 30 hashtags separated by commas or spaces (e.g. vintage, sneakers, tech).
          </Text>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. fashion, electronics, deal, trending"
              placeholderTextColor={palette.slate400}
              value={rawHashtags}
              onChangeText={setRawHashtags}
              editable={!isSubmitting}
              autoCapitalize="none"
            />
          </View>
          {parsedHashtags.length > 0 && (
            <View style={styles.tagChipsRow}>
              {parsedHashtags.map((tag, idx) => (
                <View key={`${tag}-${idx}`} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Section 4: Category (Optional) ── */}
        {/* <View style={styles.sectionCard}>
          <View style={styles.labelRowWithIcon}>
            <Text style={styles.fieldLabel}>Category (Optional)</Text>
            {categoryId && (
              <TouchableOpacity
                onPress={() => setCategoryId(null)}
                style={styles.clearSelectionBtn}
              >
                <Text style={styles.clearSelectionText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.fieldHelper}>
            Pick a category to help viewers find your reel in category feeds.
          </Text>

          {isCatLoading ? (
            <ActivityIndicator size="small" color={palette.brand500} style={{ marginVertical: 12 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  categoryId === null && styles.categoryChipSelected,
                ]}
                onPress={() => setCategoryId(null)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryId === null && styles.categoryChipTextSelected,
                  ]}
                >
                  General / None
                </Text>
              </TouchableOpacity>

              {categories?.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    onPress={() => setCategoryId(isSelected ? null : cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View> */}

        {/* ── Section 5: Location (Optional) ── */}
        <View style={styles.sectionCard}>
          <View style={styles.labelRowWithIcon}>
            <MapPin size={16} color={palette.brand500} style={{ marginRight: 6 }} />
            <Text style={styles.fieldLabel}>Location (Optional)</Text>
          </View>
          <Text style={styles.fieldHelper}>
            Specify city or neighborhood so nearby buyers can discover your reel.
          </Text>
          <View style={styles.locationInputRow}>
            <View style={[styles.textInputWrapper, { flex: 1 }]}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Bandra, Mumbai or Bengaluru"
                placeholderTextColor={palette.slate400}
                value={locationText}
                onChangeText={setLocationText}
                editable={!isSubmitting}
              />
            </View>
            <TouchableOpacity
              style={styles.detectLocationBtn}
              onPress={handleDetectLocation}
              disabled={isDetectingLocation || isSubmitting}
              accessibilityLabel="Detect Current Location"
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color={palette.brand500} />
              ) : (
                <LocateFixed size={20} color={palette.brand500} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 6: Attach Listing (Optional) ── */}
        <View style={styles.sectionCard}>
          <View style={styles.labelRowWithIcon}>
            <ShoppingBag size={16} color={palette.brand500} style={{ marginRight: 6 }} />
            <Text style={styles.fieldLabel}>Attach Product Listing (Optional)</Text>
          </View>
          <Text style={styles.fieldHelper}>
            Link one of your marketplace products to make this reel shoppable. Keep unlinked for general reels.
          </Text>

          {isListingsLoading ? (
            <ActivityIndicator size="small" color={palette.brand500} style={{ marginVertical: 12 }} />
          ) : myListings.length === 0 ? (
            <View style={styles.noListingsNotice}>
              <Text style={styles.noListingsText}>
                You have no active listings. This reel will be published as a general reel.
              </Text>
            </View>
          ) : (
            <View style={styles.listingSection}>
              {/* Selected listing display */}
              {selectedListing ? (
                <View style={styles.attachedListingCard}>
                  {selectedListing.media && selectedListing.media.length > 0 && selectedListing.media[0].url ? (
                    <ExpoImage
                      source={{ uri: selectedListing.media[0].url }}
                      style={styles.attachedListingThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.attachedListingThumbPlaceholder}>
                      <ShoppingBag size={20} color={palette.slate400} />
                    </View>
                  )}
                  <View style={styles.attachedListingInfo}>
                    <Text style={styles.attachedListingTitle} numberOfLines={1}>
                      {selectedListing.title}
                    </Text>
                    <Text style={styles.attachedListingPrice}>
                      {formatCurrencyINR(selectedListing.price)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detachListingBtn}
                    onPress={() => setSelectedListingId(null)}
                    disabled={isSubmitting}
                  >
                    <X size={16} color={palette.slate600} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.generalReelNotice}>
                  <Check size={16} color={palette.brand500} style={{ marginRight: 6 }} />
                  <Text style={styles.generalReelNoticeText}>
                    General Reel (No product attached)
                  </Text>
                </View>
              )}

              {/* Scrollable list of available user listings to pick from */}
              <Text style={styles.selectListingSubtitle}>Choose from your active listings:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listingChipsScroll}>
                <TouchableOpacity
                  style={[
                    styles.listingChip,
                    selectedListingId === null && styles.listingChipSelected,
                  ]}
                  onPress={() => setSelectedListingId(null)}
                >
                  <Text
                    style={[
                      styles.listingChipText,
                      selectedListingId === null && styles.listingChipTextSelected,
                    ]}
                  >
                    None (General)
                  </Text>
                </TouchableOpacity>

                {myListings.map((l) => {
                  const isSelected = selectedListingId === l.id;
                  return (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.listingChip, isSelected && styles.listingChipSelected]}
                      onPress={() => setSelectedListingId(isSelected ? null : l.id)}
                    >
                      <Text
                        style={[
                          styles.listingChipText,
                          isSelected && styles.listingChipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {l.title} ({formatCurrencyINR(l.price)})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── Upload & Progress Status ── */}
        {(uploadState === 'uploading' || isSubmitting) && (
          <View style={styles.uploadProgressCard}>
            <ActivityIndicator size="small" color={palette.brand500} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadProgressStatusText}>
                {uploadStatusText || (uploadState === 'uploading' ? `Uploading video: ${uploadProgress}%...` : 'Publishing reel...')}
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(0, Math.min(100, uploadProgress))}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── Submit Button ── */}
        <View style={styles.submitSection}>
          <AppButton
            title={isSubmitting ? uploadStatusText || 'Uploading & Publishing...' : 'Upload & Publish Reel'}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={!videoUri || isSubmitting}
            leftIcon={!isSubmitting ? <Upload size={18} color={palette.pureWhite} /> : undefined}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  authLockIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: palette.brand50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: spacing.xs,
  },
  authPromptSubtitle: {
    fontSize: 14,
    color: palette.slate600,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  signInBtn: {
    width: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.danger50,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.danger500,
  },
  errorBannerText: {
    flex: 1,
    color: palette.danger600,
    fontSize: 13,
    fontWeight: '500',
  },
  retryUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.danger600,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    marginLeft: 8,
  },
  retryUploadText: {
    color: palette.pureWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: palette.pureWhite,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate900,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: palette.slate500,
    marginBottom: spacing.md,
  },
  pickerBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.slate300,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: palette.slate50,
  },
  pickerIconBg: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pickerPromptTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate800,
    marginBottom: 4,
  },
  pickerPromptDesc: {
    fontSize: 12,
    color: palette.slate500,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  pickerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  pickerActionBtnPrimary: {
    backgroundColor: palette.brand500,
  },
  pickerActionBtnSecondary: {
    backgroundColor: palette.slate200,
  },
  pickerActionTextPrimary: {
    color: palette.pureWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  pickerActionTextSecondary: {
    color: palette.slate800,
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
  },
  videoWrapper: {
    width: 220,
    height: 360,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    borderWidth: 1,
    borderColor: palette.slate300,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCirclePaused: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  pauseCircleActive: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  autoplayBlockedBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  autoplayBlockedText: {
    color: palette.pureWhite,
    fontSize: 11,
    fontWeight: '600',
  },
  removeVideoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoMetaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: palette.slate700,
  },
  replaceActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  replaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: palette.brand50,
  },
  replaceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.brand700,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: 2,
  },
  labelRowWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  fieldHelper: {
    fontSize: 12,
    color: palette.slate500,
    marginBottom: spacing.xs,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: palette.slate300,
    borderRadius: radii.md,
    backgroundColor: palette.slate50,
    padding: spacing.xs,
  },
  textArea: {
    minHeight: 88,
    fontSize: 14,
    color: palette.slate900,
    padding: spacing.xs,
  },
  charCountText: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: palette.slate400,
    marginTop: 4,
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: palette.slate300,
    borderRadius: radii.md,
    backgroundColor: palette.slate50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  textInput: {
    fontSize: 14,
    color: palette.slate900,
    padding: 0,
  },
  tagChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  tagChip: {
    backgroundColor: palette.brand50,
    borderColor: palette.brand200,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: {
    fontSize: 12,
    color: palette.brand700,
    fontWeight: '600',
  },
  clearSelectionBtn: {
    marginLeft: 'auto',
  },
  clearSelectionText: {
    fontSize: 12,
    color: palette.brand600,
    fontWeight: '600',
  },
  chipScroll: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: palette.brand500,
    borderColor: palette.brand500,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate700,
  },
  categoryChipTextSelected: {
    color: palette.pureWhite,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detectLocationBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: palette.brand50,
    borderWidth: 1,
    borderColor: palette.brand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noListingsNotice: {
    padding: spacing.sm,
    backgroundColor: palette.slate100,
    borderRadius: radii.md,
  },
  noListingsText: {
    fontSize: 12,
    color: palette.slate600,
  },
  listingSection: {
    marginTop: 4,
  },
  attachedListingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    backgroundColor: palette.brand50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.brand200,
    marginBottom: spacing.xs,
  },
  attachedListingThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
  },
  attachedListingThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedListingInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  attachedListingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate900,
  },
  attachedListingPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.brand600,
  },
  detachListingBtn: {
    padding: 6,
  },
  generalReelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate50,
    padding: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginBottom: spacing.xs,
  },
  generalReelNoticeText: {
    fontSize: 12,
    color: palette.slate700,
    fontWeight: '500',
  },
  selectListingSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate700,
    marginBottom: 4,
  },
  listingChipsScroll: {
    flexDirection: 'row',
  },
  listingChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: 8,
    maxWidth: 200,
  },
  listingChipSelected: {
    backgroundColor: palette.brand500,
    borderColor: palette.brand500,
  },
  listingChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.slate700,
  },
  listingChipTextSelected: {
    color: palette.pureWhite,
  },
  uploadProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.brand50,
    borderColor: palette.brand200,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  uploadProgressStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.brand800,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: palette.slate200,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: palette.brand500,
  },
  submitSection: {
    marginTop: spacing.xs,
  },
  submitButton: {
    width: '100%',
  },
});
