import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { AppHeader } from '../../../components/ui/AppHeader';
import { AppInput } from '../../../components/ui/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { Badge } from '../../../components/ui/Badge';
import { palette, radii, spacing, typography } from '../../../constants/tokens';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useListingDetailQuery, LISTING_QUERY_KEYS } from '../../../hooks/useListings';
import { useCategoriesQuery } from '../../../hooks/useCategories';
import { listingsService } from '../../../services/listings.service';
import { mediaService } from '../../../services/media.service';
import { reelsService } from '../../../services/reels.service';
import { queryClient } from '../../../providers/QueryProvider';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const { data: listing, isLoading: isListingLoading } = useListingDetailQuery(id || '');
  const { data: categories, isLoading: isCatLoading } = useCategoriesQuery('flat');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Existing media
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  // New photos to add
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);

  // Reel video (add reel later or replace)
  const [newReelUri, setNewReelUri] = useState<string | null>(null);
  const [newReelFileName, setNewReelFileName] = useState<string | null>(null);
  const [newReelMimeType, setNewReelMimeType] = useState<string | null>(null);
  const [newReelDuration, setNewReelDuration] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Populate listing data once loaded
  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setPrice(String(listing.price || ''));
      setCategoryId(listing.categoryId || '');
      setCity(listing.locationCity || '');
      setState(listing.locationState || '');
      setContactPhone(listing.contactPhone || '');
      setExistingMedia(listing.media || []);
    }
  }, [listing]);

  if (!isAuthenticated) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Edit Product" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.alertIcon}>🔒</Text>
          <Text style={styles.alertTitle}>Sign in required</Text>
          <Text style={styles.alertSubtitle}>Please sign in to edit your product listing.</Text>
          <AppButton
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            size="md"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (isListingLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Edit Product" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#002f34" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!listing) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Edit Product" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertTitle}>Product Not Found</Text>
          <Text style={styles.alertSubtitle}>This product does not exist or has been removed.</Text>
          <AppButton
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            size="md"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScreenContainer>
    );
  }

  // Strict ownership check: only the owner can edit their own product!
  const isOwner = user?.id === listing.ownerId;
  if (!isOwner) {
    return (
      <ScreenContainer scrollable={false}>
        <AppHeader title="Edit Product" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.alertIcon}>🚫</Text>
          <Text style={styles.alertTitle}>Access Denied</Text>
          <Text style={styles.alertSubtitle}>
            Only the owner who created this product listing is permitted to edit it or add reels.
          </Text>
          <AppButton
            title="Return to Product"
            onPress={() => router.back()}
            variant="primary"
            size="md"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScreenContainer>
    );
  }

  // Pick new photos (multiple)
  const handlePickNewPhotos = async () => {
    try {
      const currentCount = existingMedia.length + newPhotoUris.length;
      const remaining = 12 - currentCount;
      if (remaining <= 0) {
        Alert.alert('Maximum Reached', 'You can have up to 12 photos for this product.');
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
        setNewPhotoUris((prev) => [...prev, ...uris].slice(0, remaining));
      }
    } catch {
      Alert.alert('Permission Error', 'Unable to access device photos.');
    }
  };

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  // Delete existing media from backend
  const handleDeleteExistingMedia = async (mediaId: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to remove this photo from your listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingMediaId(mediaId);
            await listingsService.deleteMedia(listing.id, mediaId);
            setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
            queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.detail(listing.id) });
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete photo.');
          } finally {
            setDeletingMediaId(null);
          }
        },
      },
    ]);
  };

  // Pick new/replacement reel video (any format: mp4, mov, webm, avi, etc.)
  const handlePickReelVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setNewReelUri(asset.uri);
        setNewReelFileName(asset.fileName || asset.uri.split('/').pop() || 'reel_video.mp4');
        setNewReelMimeType(asset.mimeType || 'video/mp4');
        setNewReelDuration(asset.duration ? Math.round(asset.duration) : null);
      }
    } catch {
      Alert.alert('Permission Error', 'Unable to access videos.');
    }
  };

  const handleRemoveNewReel = () => {
    setNewReelUri(null);
    setNewReelFileName(null);
    setNewReelMimeType(null);
    setNewReelDuration(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a product title');
      return;
    }

    const parsedPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    if (parsedPrice <= 0) {
      setErrorMsg('Please enter a valid price');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setStatusMessage('Saving product details...');

    try {
      // 1. Update listing text & attributes
      await listingsService.updateListing(listing.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        categoryId: categoryId || listing.categoryId,
        contactPhone: contactPhone.trim(),
        locationCity: city.trim(),
        locationState: state.trim(),
      });

      // 2. Upload any newly added photos
      if (newPhotoUris.length > 0) {
        setStatusMessage(`Uploading ${newPhotoUris.length} new photos...`);
        try {
          await mediaService.uploadMultipleListingImages(listing.id, newPhotoUris);
        } catch (imgErr) {
          console.warn('Failed uploading new photos:', imgErr);
        }
      }

      // 3. Upload / attach Reel if selected
      if (newReelUri) {
        setStatusMessage('Uploading product video reel...');
        try {
          const reel = await reelsService.createReel({
            title: title.trim(),
            description: description.trim() || undefined,
            listingId: listing.id,
          });

          await mediaService.uploadReelMedia(reel.id, newReelUri, {
            fileName: newReelFileName || undefined,
            mimeType: newReelMimeType || undefined,
          });
        } catch (reelErr) {
          console.warn('Failed uploading reel:', reelErr);
        }
      }

      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.detail(listing.id) });
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['reels'] });

      setStatusMessage('Done!');
      Alert.alert('Success! 🎉', 'Your product has been updated successfully.', [
        {
          text: 'View Product',
          onPress: () => router.replace(`/listing/${listing.id}`),
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasExistingReel = listing.reels && listing.reels.length > 0;

  return (
    <ScreenContainer scrollable hasBottomTab={false}>
      <AppHeader title="Edit Product" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Owner Verified Notice */}
        <View style={styles.ownerNoticeCard}>
          <Text style={styles.ownerNoticeIcon}>👑</Text>
          <View style={styles.ownerNoticeContent}>
            <Text style={styles.ownerNoticeTitle}>Owner Editing Mode</Text>
            <Text style={styles.ownerNoticeSubtitle}>
              You are editing your product. Changes will reflect live across the marketplace.
            </Text>
          </View>
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Section 1: Product Photos ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionBlockHeader}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sectionBlockTitle}>📸 Product Photos</Text>
              <Badge
                label={`${existingMedia.length + newPhotoUris.length}/12 Photos`}
                variant="brand"
              />
            </View>
            <Text style={styles.sectionBlockSubtitle}>
              Add more photos or remove existing ones. High quality photos attract more inquiries.
            </Text>
          </View>

          {/* Current & New Photos Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScrollList}>
            {/* Existing Photos */}
            {existingMedia.map((m, index) => (
              <View key={m.id || index} style={styles.photoItemCard}>
                <Image
                  source={{ uri: m.url || m.thumbnailKey }}
                  style={styles.photoThumb}
                  resizeMode="cover"
                />
                <View style={styles.existingTag}>
                  <Text style={styles.existingTagText}>LIVE</Text>
                </View>
                <TouchableOpacity
                  style={styles.deletePhotoBtn}
                  onPress={() => handleDeleteExistingMedia(m.id)}
                  disabled={deletingMediaId === m.id}
                  activeOpacity={0.8}
                >
                  {deletingMediaId === m.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deletePhotoBtnText}>🗑️</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {/* Newly Picked Photos */}
            {newPhotoUris.map((uri, index) => (
              <View key={uri + index} style={[styles.photoItemCard, styles.newPhotoBorder]}>
                <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                <View style={styles.newTag}>
                  <Text style={styles.newTagText}>NEW</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeNewPhotoBtn}
                  onPress={() => handleRemoveNewPhoto(index)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeNewPhotoBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add More Photos Card */}
            {existingMedia.length + newPhotoUris.length < 12 && (
              <TouchableOpacity
                style={styles.addPhotosBox}
                onPress={handlePickNewPhotos}
                activeOpacity={0.8}
              >
                <Text style={styles.addPhotosIcon}>+</Text>
                <Text style={styles.addPhotosLabel}>Add More</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Section 2: Video Reel (Add Reels Later or Replace) ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionBlockHeader}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.sectionBlockTitle}>📹 Video Reel Showcase</Text>
              <Badge
                label={hasExistingReel ? 'REEL ATTACHED' : 'BOOST VIEWS'}
                variant={hasExistingReel ? 'success' : 'brand'}
              />
            </View>
            <Text style={styles.sectionBlockSubtitle}>
              Upload a 60s video reel in any format (MP4, MOV, WebM, etc.). Appears on the Mandi Reels home screen!
            </Text>
          </View>

          {/* If new reel picked */}
          {newReelUri ? (
            <View style={styles.newReelPreviewCard}>
              <View style={styles.newReelInfo}>
                <Text style={styles.newReelEmoji}>🎬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.newReelName} numberOfLines={1}>
                    {newReelFileName || 'Selected Video Reel'}
                  </Text>
                  <Text style={styles.newReelMeta}>
                    {newReelDuration ? `${newReelDuration}s • ` : ''}Format: {newReelFileName?.split('.').pop()?.toUpperCase() || 'VIDEO'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeReelBtn}
                  onPress={handleRemoveNewReel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeReelBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : hasExistingReel ? (
            /* Existing reel attached */
            <View style={styles.existingReelCard}>
              <View style={styles.existingReelContent}>
                <Text style={styles.existingReelIcon}>🎥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.existingReelTitle}>Current Video Reel is Live</Text>
                  <Text style={styles.existingReelSubtitle}>
                    Your product already has a reel on Mandi Reels.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.replaceReelBtn}
                onPress={handlePickReelVideo}
                activeOpacity={0.8}
              >
                <Text style={styles.replaceReelBtnText}>🔄 Replace Video Reel (MP4, MOV, etc.)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* No reel yet: Add Reel Later CTA */
            <TouchableOpacity
              style={styles.addReelLaterBox}
              onPress={handlePickReelVideo}
              activeOpacity={0.8}
            >
              <Text style={styles.addReelLaterIcon}>📹</Text>
              <Text style={styles.addReelLaterTitle}>+ Add a Video Reel Now</Text>
              <Text style={styles.addReelLaterSubtitle}>
                Supports MP4, MOV, WebM and other formats. Show off your item in action!
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Section 3: Product Details ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionBlockTitle}>📝 Product Details</Text>

          <AppInput
            label="Product Title *"
            placeholder="e.g. iPhone 15 Pro Max / Royal Enfield Classic"
            value={title}
            onChangeText={setTitle}
          />

          <AppInput
            label="Price (INR) *"
            placeholder="e.g. 45000"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            leftAccessory={<Text style={styles.currencyPrefix}>₹</Text>}
          />

          {/* Category Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
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
            placeholder="Describe product condition, usage, specifications..."
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

        {/* Save Changes Button */}
        <AppButton
          title={isSubmitting ? statusMessage || 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          style={styles.saveBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  alertIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: spacing.xs,
  },
  alertSubtitle: {
    fontSize: 14,
    color: palette.slate600,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: palette.slate600,
  },
  ownerNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002f34',
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ownerNoticeIcon: {
    fontSize: 26,
    marginRight: spacing.md,
  },
  ownerNoticeContent: {
    flex: 1,
  },
  ownerNoticeTitle: {
    color: palette.pureWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  ownerNoticeSubtitle: {
    color: palette.slate300,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  errorBanner: {
    backgroundColor: palette.danger50,
    borderWidth: 1,
    borderColor: palette.danger500,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
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
  photosScrollList: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  photoItemCard: {
    width: 105,
    height: 105,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginRight: spacing.sm,
    position: 'relative',
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  newPhotoBorder: {
    borderColor: palette.brand500,
    borderWidth: 2,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  existingTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#002f34',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  existingTagText: {
    color: palette.pureWhite,
    fontSize: 9,
    fontWeight: '800',
  },
  newTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: palette.brand500,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newTagText: {
    color: palette.pureWhite,
    fontSize: 9,
    fontWeight: '800',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePhotoBtnText: {
    fontSize: 13,
  },
  removeNewPhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeNewPhotoBtnText: {
    color: palette.pureWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  addPhotosBox: {
    width: 105,
    height: 105,
    borderRadius: radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.brand500,
    backgroundColor: '#f0f9f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  addPhotosIcon: {
    fontSize: 26,
    color: palette.brand500,
    fontWeight: '700',
  },
  addPhotosLabel: {
    fontSize: 11,
    color: palette.brand500,
    fontWeight: '600',
    marginTop: 2,
  },
  addReelLaterBox: {
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
  addReelLaterIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  addReelLaterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
  },
  addReelLaterSubtitle: {
    fontSize: 12,
    color: palette.slate600,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  existingReelCard: {
    backgroundColor: '#f8fafc',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  existingReelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  existingReelIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  existingReelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.slate900,
  },
  existingReelSubtitle: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
  },
  replaceReelBtn: {
    backgroundColor: '#002f34',
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  replaceReelBtnText: {
    color: palette.pureWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  newReelPreviewCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  newReelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newReelEmoji: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  newReelName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  newReelMeta: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
  },
  removeReelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  removeReelBtnText: {
    color: palette.pureWhite,
    fontSize: 13,
    fontWeight: '700',
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
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.slate300,
    marginRight: spacing.xs,
    backgroundColor: palette.pureWhite,
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
  saveBtn: {
    marginTop: spacing.sm,
  },
});
