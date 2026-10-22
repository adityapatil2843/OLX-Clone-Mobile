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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCategoriesQuery } from '../../hooks/useCategories';
import { useCreateListingMutation } from '../../hooks/useListings';
import { useCreateReelMutation } from '../../hooks/useReels';
import { mediaService } from '../../services/media.service';

export default function CreateListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const isReelMode = params.type === 'reel';

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
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video'>(isReelMode ? 'video' : 'image');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: isReelMode ? ['videos'] : ['images'],
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMediaUri(asset.uri);
        setSelectedMediaType(asset.type === 'video' ? 'video' : 'image');
      }
    } catch {
      Alert.alert('Error', 'Unable to access media library. Please grant permissions in Settings.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a title');
      return;
    }
    if (!isReelMode && !price.trim()) {
      setErrorMsg('Please enter a price');
      return;
    }
    if (!isReelMode && !categoryId) {
      setErrorMsg('Please select a category');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (isReelMode) {
        // Create Reel
        const reel = await createReelMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
        });

        // If video picked, upload to reel
        if (selectedMediaUri) {
          try {
            await mediaService.uploadReelMedia(reel.id, selectedMediaUri);
          } catch (uploadErr) {
            console.warn('Reel video upload warning:', uploadErr);
          }
        }

        Alert.alert('Success', 'Your Reel has been posted!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/reels') },
        ]);
      } else {
        // Create regular Classified Listing
        const parsedPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
        const listing = await createListingMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          price: parsedPrice,
          categoryId,
          contactPhone: contactPhone.trim(),
          locationCity: city.trim(),
          locationState: state.trim(),
        });

        // If media picked, upload to listing
        if (selectedMediaUri) {
          try {
            await mediaService.uploadListingMedia(listing.id, {
              uri: selectedMediaUri,
              type: selectedMediaType,
            });
          } catch (uploadErr) {
            console.warn('Listing media upload warning:', uploadErr);
          }
        }

        Alert.alert('Success', 'Your listing is now live!', [
          { text: 'View Listing', onPress: () => router.replace(`/listing/${listing.id}`) },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title={isReelMode ? 'Post a Video Reel' : 'Create Listing'}
        onBack={() => router.back()}
      />

      <View style={styles.formContent}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Media Picker Button / Preview */}
        <TouchableOpacity style={styles.mediaPickerBox} onPress={handlePickMedia} activeOpacity={0.8}>
          {selectedMediaUri ? (
            <View style={styles.mediaPreviewContainer}>
              <Image source={{ uri: selectedMediaUri }} style={styles.mediaPreview} resizeMode="cover" />
              <View style={styles.changeMediaPill}>
                <Text style={styles.changeMediaText}>Tap to change</Text>
              </View>
            </View>
          ) : (
            <View style={styles.mediaPickerPlaceholder}>
              <Text style={styles.pickerIcon}>{isReelMode ? '📹' : '📸'}</Text>
              <Text style={styles.pickerLabel}>
                {isReelMode ? 'Select a product showcase video (up to 60s)' : 'Add photos of your item'}
              </Text>
              <Text style={styles.pickerHint}>Tap to open gallery</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Inputs */}
        <AppInput
          label="Title *"
          placeholder="e.g. Honda City ZX 2022 / iPhone 15 Pro"
          value={title}
          onChangeText={setTitle}
        />

        {!isReelMode && (
          <AppInput
            label="Price (INR) *"
            placeholder="e.g. 25000"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            leftAccessory={<Text style={styles.currencyPrefix}>₹</Text>}
          />
        )}

        {/* Category Selector */}
        {!isReelMode && (
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
        )}

        <AppInput
          label="Description"
          placeholder="Include condition, specifications, reasons for selling..."
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

        <AppButton
          title={isSubmitting ? 'Posting...' : isReelMode ? 'Publish Reel' : 'Post Now'}
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
  mediaPickerBox: {
    height: 180,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.slate300,
    backgroundColor: palette.pureWhite,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  mediaPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  changeMediaPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  changeMediaText: {
    color: palette.pureWhite,
    fontSize: 11,
    fontWeight: '600',
  },
  mediaPickerPlaceholder: {
    alignItems: 'center',
    padding: spacing.md,
  },
  pickerIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate700,
    textAlign: 'center',
  },
  pickerHint: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 4,
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
    marginTop: spacing.lg,
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
