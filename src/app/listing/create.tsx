import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { Badge } from '../../components/ui/Badge';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCategoriesQuery } from '../../hooks/useCategories';
import { useCreateListingMutation, LISTING_QUERY_KEYS } from '../../hooks/useListings';
import { useCreateReelMutation } from '../../hooks/useReels';
import { env } from '../../config/env';
import { tokenStorage } from '../../services/token-storage';
import { mediaService } from '../../services/media.service';
import { queryClient } from '../../providers/QueryProvider';

export default function CreateListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const isInitialReelMode = params.type === 'reel';

  const { user, isAuthenticated } = useAuthStore();
  const { data: categories, isLoading: isCatLoading } = useCategoriesQuery('flat');
  const createListingMutation = useCreateListingMutation();
  const createReelMutation = useCreateReelMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState(user?.locationCity || user?.city || 'Mumbai');
  const [state, setState] = useState(user?.locationState || user?.state || 'Maharashtra');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+919876543210');

  // Photos media (multiple)
  const [selectedPhotoUris, setSelectedPhotoUris] = useState<string[]>([]);

  // Reel video media (any format: mp4, mov, webm, etc.)
  const [selectedReelVideoUri, setSelectedReelVideoUri] = useState<string | null>(null);
  const [selectedReelFileName, setSelectedReelFileName] = useState<string | null>(null);
  const [selectedReelMimeType, setSelectedReelMimeType] = useState<string | null>(null);
  const [reelDuration, setReelDuration] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthenticated) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Post to Marketplace" onBack={() => router.back()} />
        <View style={styles.authPromptContainer}>
          <Text style={styles.authPromptIcon}>🔒</Text>
          <Text style={styles.authPromptTitle}>Sign in required</Text>
          <Text style={styles.authPromptSubtitle}>
            You must be logged in to post listings or share video reels on Mandi Live.
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

  // Pick photos (allow multiple)
  const handlePickPhoto = async () => {
    try {
      const remaining = 10 - selectedPhotoUris.length;
      if (remaining <= 0) {
        Alert.alert('Limit Reached', 'You can upload a maximum of 10 photos per listing.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri);
        setSelectedPhotoUris((prev) => [...prev, ...uris].slice(0, 10));
      }
    } catch {
      Alert.alert('Permission Error', 'Unable to access photos. Please check device permissions.');
    }
  };

  // Pick reel video (any format: mp4, mov, webm, etc.)
  const handlePickReelVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedReelVideoUri(asset.uri);
        setSelectedReelFileName(asset.fileName || asset.uri.split('/').pop() || 'reel_video.mp4');
        setSelectedReelMimeType(asset.mimeType || 'video/mp4');
        setReelDuration(asset.duration ? Math.round(asset.duration) : null);
      }
    } catch {
      Alert.alert('Permission Error', 'Unable to access videos. Please check device permissions.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveReel = () => {
    setSelectedReelVideoUri(null);
    setSelectedReelFileName(null);
    setSelectedReelMimeType(null);
    setReelDuration(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a title for your product');
      return;
    }

    if (!price.trim() && !isInitialReelMode) {
      setErrorMsg('Please enter a price');
      return;
    }

    if (!categoryId && categories && categories.length > 0) {
      // If no category picked yet, pick the first one by default if available
      setCategoryId(categories[0].id);
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setUploadStatusText('Creating listing...');

    try {
      const parsedPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
      const targetCategoryId = categoryId || categories?.[0]?.id || '';
      let createdListingId: string;

      // ── Step 1: Create the Listing ──────────────────────────
      const listing = await createListingMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        categoryId: targetCategoryId,
        contactPhone: contactPhone.trim(),
        locationCity: city.trim(),
        locationState: state.trim(),
      });
      createdListingId = listing.id;

      // ── Step 2: Upload all chosen photos if any ───────────────
      if (selectedPhotoUris.length > 0) {
        setUploadStatusText(`Uploading ${selectedPhotoUris.length} photos...`);
        try {
          await mediaService.uploadMultipleListingImages(createdListingId, selectedPhotoUris);
        } catch (imgErr) {
          console.warn('Image upload error:', imgErr);
        }
      }

      // ── Step 3: Upload Reel linked to this listing if selected ──────
      if (selectedReelVideoUri) {
        setUploadStatusText('Uploading product video reel...');
        try {
          const reel = await createReelMutation.mutateAsync({
            title: title.trim(),
            description: description.trim() || undefined,
            listingId: createdListingId,
          });

          await mediaService.uploadReelMedia(reel.id, selectedReelVideoUri, {
            fileName: selectedReelFileName || undefined,
            mimeType: selectedReelMimeType || undefined,
          });
        } catch (reelErr) {
          console.warn('Reel upload notice:', reelErr);
        }
      }

      // Refresh query caches
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['reels'] });

      // ── Step 3: Redirect to newly created listing ───────────
      setUploadStatusText('Product created! Redirecting...');
      Alert.alert(
        'Success! 🎉',
        selectedReelVideoUri
          ? 'Your product listing and video reel are now live on Mandi!'
          : 'Your product listing has been published!',
        [
          {
            text: 'View Your Product',
            onPress: () => router.replace(`/listing/${createdListingId}`),
          },
        ]
      );

      // Proactively navigate to show the created product
      setTimeout(() => {
        router.replace(`/listing/${createdListingId}`);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title={isInitialReelMode ? 'Post Product Reel' : 'Add Product Listing'}
        onBack={() => router.back()}
      />

      <View style={styles.formContent}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Section: Product Reel (Showcase Video) ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionBlockHeader}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sectionBlockTitle}>📹 Product Video Reel</Text>
              <Badge label="4X INQUIRIES" variant="brand" />
            </View>
            <Text style={styles.sectionBlockSubtitle}>
              Upload a 60-second video showcase of your item for the Reels home feed.
            </Text>
          </View>

          {selectedReelVideoUri ? (
            <View style={styles.reelSelectedCard}>
              <View style={styles.reelVideoPreview}>
                <Text style={styles.reelIconBig}>🎬</Text>
                <View style={styles.reelVideoDetails}>
                  <Text style={styles.reelVideoTitle}>Product Video Reel Attached</Text>
                  <Text style={styles.reelVideoDuration}>
                    {reelDuration ? `Duration: ~${reelDuration}s` : 'Max 60s showcase'} • Linked to listing
                  </Text>
                </View>
              </View>
              <View style={styles.reelActionsRow}>
                <TouchableOpacity style={styles.changeActionBtn} onPress={handlePickReelVideo}>
                  <Text style={styles.changeActionText}>Replace Video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeActionBtn} onPress={handleRemoveReel}>
                  <Text style={styles.removeActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.reelPickerBox}
              onPress={handlePickReelVideo}
              activeOpacity={0.8}
            >
              <View style={styles.reelPickerInner}>
                <Text style={styles.reelPickerIcon}>🎥</Text>
                <Text style={styles.reelPickerLabel}>Upload Video Reel</Text>
                <Text style={styles.reelPickerSublabel}>
                  Record or choose a showcase clip (up to 60s)
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Section: Product Photos ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionBlockHeader}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sectionBlockTitle}>📸 Product Photos</Text>
              <Badge label={`${selectedPhotoUris.length}/10 Photos`} variant={selectedPhotoUris.length > 0 ? 'success' : 'default'} />
            </View>
            <Text style={styles.sectionBlockSubtitle}>
              Add up to 10 photos. Listings with multiple photos get 3x more buyer inquiries.
            </Text>
          </View>

          {selectedPhotoUris.length > 0 ? (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollList}>
                {selectedPhotoUris.map((uri, index) => (
                  <View key={uri + index} style={styles.multiPhotoCard}>
                    <Image source={{ uri }} style={styles.multiPhotoThumb} resizeMode="cover" />
                    {index === 0 && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>COVER</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.multiPhotoRemoveBtn}
                      onPress={() => handleRemovePhoto(index)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {selectedPhotoUris.length < 10 && (
                  <TouchableOpacity
                    style={styles.addMorePhotoBox}
                    onPress={handlePickPhoto}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addMorePhotoIcon}>+</Text>
                    <Text style={styles.addMorePhotoLabel}>Add More</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoPickerBox}
              onPress={handlePickPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.photoPickerIcon}>📷</Text>
              <Text style={styles.photoPickerLabel}>Add Product Photos (up to 10)</Text>
              <Text style={styles.photoPickerSublabel}>Tap to select multiple photos from gallery</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Section: Product Details ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionBlockTitle}>📝 Product Details</Text>

          <AppInput
            label="Product Title *"
            placeholder="e.g. Honda City ZX 2022 / iPhone 15 Pro Max"
            value={title}
            onChangeText={setTitle}
          />

          <AppInput
            label="Price (INR) *"
            placeholder="e.g. 25000"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            leftAccessory={<Text style={styles.currencyPrefix}>₹</Text>}
          />

          {/* Category Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category *</Text>
            {isCatLoading ? (
              <ActivityIndicator size="small" color="#002f34" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories?.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChoice, isSelected && styles.categoryChoiceSelected]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChoiceText,
                          isSelected && styles.categoryChoiceTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <AppInput
            label="Description"
            placeholder="Describe item condition, key features, reasons for selling..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <AppInput label="City" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput label="State" value={state} onChangeText={setState} />
            </View>
          </View>

          <AppInput
            label="Contact Phone"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Submit Button */}
        <AppButton
          title={
            isSubmitting
              ? uploadStatusText || 'Publishing...'
              : selectedReelVideoUri
              ? 'Post Product & Reel'
              : 'Post Product Now'
          }
          onPress={handleSubmit}
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formContent: {
    paddingVertical: spacing.md,
  },
  errorBanner: {
    backgroundColor: palette.danger50,
    borderWidth: 1,
    borderColor: palette.danger500,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: palette.danger600,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionBlock: {
    backgroundColor: palette.pureWhite,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginBottom: spacing.lg,
  },
  sectionBlockHeader: {
    marginBottom: spacing.md,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionBlockTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
  },
  sectionBlockSubtitle: {
    fontSize: 12,
    color: palette.slate500,
    lineHeight: 18,
  },
  reelPickerBox: {
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#002f34',
    backgroundColor: '#f0f9f8',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelPickerInner: {
    alignItems: 'center',
  },
  reelPickerIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  reelPickerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
  },
  reelPickerSublabel: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
    textAlign: 'center',
  },
  reelSelectedCard: {
    backgroundColor: '#e6f7f6',
    borderWidth: 1,
    borderColor: '#23e5db',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  reelVideoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reelIconBig: {
    fontSize: 34,
    marginRight: spacing.md,
  },
  reelVideoDetails: {
    flex: 1,
  },
  reelVideoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
  },
  reelVideoDuration: {
    fontSize: 12,
    color: palette.slate600,
    marginTop: 2,
  },
  reelActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  changeActionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.pureWhite,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.slate300,
  },
  changeActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate800,
  },
  removeActionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.danger50,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.danger500,
  },
  removeActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.danger600,
  },
  photoPickerBox: {
    height: 120,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.slate300,
    backgroundColor: palette.slate50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  photoPickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate700,
  },
  photoPickerSublabel: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 2,
  },
  photoPreviewCard: {
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: palette.slate100,
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  photoOverlayActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoChangeBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  photoChangeText: {
    color: palette.pureWhite,
    fontSize: 11,
    fontWeight: '600',
  },
  photoRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: palette.pureWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  photosScrollList: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  multiPhotoCard: {
    width: 110,
    height: 110,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginRight: spacing.sm,
    position: 'relative',
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  multiPhotoThumb: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#002f34',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverBadgeText: {
    color: palette.pureWhite,
    fontSize: 9,
    fontWeight: '800',
  },
  multiPhotoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMorePhotoBox: {
    width: 110,
    height: 110,
    borderRadius: radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.brand500,
    backgroundColor: palette.brand50 || '#f0f9f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  addMorePhotoIcon: {
    fontSize: 26,
    color: palette.brand500,
    fontWeight: '700',
  },
  addMorePhotoLabel: {
    fontSize: 11,
    color: palette.brand500,
    fontWeight: '600',
    marginTop: 2,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginRight: 4,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.slate700,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  catScroll: {
    flexDirection: 'row',
  },
  categoryChoice: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: palette.pureWhite,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: spacing.xs,
  },
  categoryChoiceSelected: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  categoryChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate700,
  },
  categoryChoiceTextSelected: {
    color: palette.pureWhite,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: '#002f34',
  },
  authPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  authPromptIcon: {
    fontSize: 54,
    marginBottom: spacing.md,
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.xs,
  },
  authPromptSubtitle: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#002f34',
  },
});
