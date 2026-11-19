import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { Badge } from '../../components/ui/Badge';
import { LocationPicker } from '../../components/ui/LocationPicker';
import { palette, radii, spacing } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  useUserProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '../../hooks/useUser';
import { User, MapPin, Camera, ArrowLeft } from 'lucide-react-native';

export default function ProfileScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const isSelf = id === 'self' || id === currentUser?.id;
  const targetUserId = isSelf ? (currentUser?.id || '') : (id || '');

  const { data: profile, isLoading } = useUserProfileQuery(targetUserId);
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();

  const displayedUser = profile || (isSelf ? currentUser : null);

  // Automatically activate edit mode when arriving from "View & Edit Profile" (?edit=true)
  const isEditRequested = isSelf && (edit === 'true' || edit === '1');
  const [isEditing, setIsEditing] = useState(() => Boolean(isEditRequested));

  // Form field overrides (null means fall back directly to displayedUser values)
  const [editedName, setEditedName] = useState<string | null>(null);
  const [editedBio, setEditedBio] = useState<string | null>(null);
  const [editedCity, setEditedCity] = useState<string | null>(null);
  const [editedState, setEditedState] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const name = editedName !== null ? editedName : (displayedUser?.name || '');
  const bio = editedBio !== null ? editedBio : (displayedUser?.bio || '');
  const city = editedCity !== null ? editedCity : (displayedUser?.locationCity || displayedUser?.city || '');
  const state = editedState !== null ? editedState : (displayedUser?.locationState || displayedUser?.state || '');

  const handlePickAvatar = async () => {
    if (!isSelf || !targetUserId) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploadingAvatar(true);
        uploadAvatarMutation.mutate(
          {
            userId: targetUserId,
            imageUri: asset.uri,
            fileName: asset.fileName || `avatar_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
          },
          {
            onSuccess: () => {
              setIsUploadingAvatar(false);
              Alert.alert('Success', 'Profile picture updated successfully!');
            },
            onError: (err: any) => {
              setIsUploadingAvatar(false);
              Alert.alert('Upload Failed', err.message || 'Failed to upload profile picture.');
            },
          }
        );
      }
    } catch {
      setIsUploadingAvatar(false);
      Alert.alert('Permission Error', 'Unable to access photos. Please check device permissions.');
    }
  };

  const handleStartEdit = () => {
    setEditedName(null);
    setEditedBio(null);
    setEditedCity(null);
    setEditedState(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedName(null);
    setEditedBio(null);
    setEditedCity(null);
    setEditedState(null);
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    if (!targetUserId) return;
    updateProfileMutation.mutate(
      {
        userId: targetUserId,
        payload: {
          name: name.trim() || undefined,
          bio: bio.trim() || undefined,
          locationCity: city.trim() || undefined,
          locationState: state.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditedName(null);
          setEditedBio(null);
          setEditedCity(null);
          setEditedState(null);
          setIsEditing(false);
          Alert.alert('Success', 'Profile updated successfully!');
        },
        onError: (err: any) => {
          Alert.alert('Error', err.message || 'Failed to update profile');
        },
      }
    );
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title={isSelf ? (isEditing ? 'Edit Profile' : 'My Profile') : 'Seller Profile'}
        onBack={() => router.back()}
        left={<ArrowLeft size={24} color="#002f34" />}
        rightAction={
          isSelf ? (
            isEditing ? (
              <TouchableOpacity
                onPress={handleCancelEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleStartEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.editActionText}>Edit</Text>
              </TouchableOpacity>
            )
          ) : undefined
        }
      />

      {isLoading && !displayedUser ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#002f34" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarLarge}
                onPress={isSelf ? handlePickAvatar : undefined}
                activeOpacity={isSelf ? 0.75 : 1}
                disabled={isUploadingAvatar}
              >
                {displayedUser?.avatarUrl ? (
                  <ExpoImage
                    source={{ uri: optimizeCloudinaryUrl(displayedUser.avatarUrl) }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={150}
                  />
                ) : displayedUser?.name ? (
                  <Text style={styles.avatarLargeText}>
                    {displayedUser.name[0].toUpperCase()}
                  </Text>
                ) : (
                  <User size={36} color="#666" />
                )}

                {/* Loading spinner over avatar while uploading */}
                {isUploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color={palette.pureWhite} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Camera icon badge for the profile owner */}
              {isSelf && (
                <TouchableOpacity
                  style={styles.cameraBadge}
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}
                  activeOpacity={0.8}
                >
                  <Camera size={14} color={palette.pureWhite} />
                </TouchableOpacity>
              )}
            </View>

            {isSelf && (
              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                style={styles.changePhotoBtn}
              >
                <Text style={styles.changePhotoText}>
                  {isUploadingAvatar ? 'Uploading photo...' : 'Change Profile Photo'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.profileHeaderInfo}>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.profileName}>{displayedUser?.name || 'User'}</Text>
                {displayedUser?.isVerifiedSeller && (
                  <Badge label="VERIFIED SELLER" variant="brand" />
                )}
              </View>

              {/* REPLACED EMOJI 📍 WITH LUCIDE MapPin ICON WRAPPED IN A ROW */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MapPin size={14} color="#666" style={{ marginRight: 4 }} />
                <Text style={styles.locationText}>
                  {[displayedUser?.locationCity || displayedUser?.city, displayedUser?.locationState || displayedUser?.state].filter(Boolean).join(', ') || 'India'}
                </Text>
              </View>

              {displayedUser?.createdAt && (
                <Text style={styles.joinedText}>
                  Member since {new Date(displayedUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </Text>
              )}
            </View>
          </View>

          {/* Edit Form or Bio View */}
          {isEditing ? (
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>Edit Profile Information</Text>
              <AppInput label="Full Name" value={name} onChangeText={setEditedName} />
              <AppInput
                label="About You / Bio"
                value={bio}
                onChangeText={setEditedBio}
                placeholder="Tell buyers about yourself or your business..."
                multiline
                numberOfLines={3}
              />
              <LocationPicker
                selectedState={state}
                selectedDistrict={city}
                onStateChange={setEditedState}
                onDistrictChange={setEditedCity}
                showDetectButton={true}
              />

              <View style={styles.editButtonRow}>
                <AppButton
                  title="Cancel"
                  onPress={handleCancelEdit}
                  variant="outline"
                  size="md"
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title={updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  onPress={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  variant="primary"
                  size="md"
                  style={{ flex: 1, backgroundColor: '#002f34' }}
                />
              </View>
            </View>
          ) : displayedUser?.bio ? (
            <View style={styles.bioCard}>
              <Text style={styles.sectionHeading}>About</Text>
              <Text style={styles.bioText}>{displayedUser.bio}</Text>
            </View>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.md,
  },
  profileCard: {
    backgroundColor: palette.pureWhite,
    padding: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.slate200,
    marginBottom: spacing.md,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#002f34',
    overflow: 'hidden',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#002f34',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: palette.pureWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    marginBottom: spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.brand600,
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#002f34',
  },
  profileHeaderInfo: {
    alignItems: 'center',
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.slate900,
  },
  locationText: {
    fontSize: 13,
    color: palette.slate600,
    marginTop: 2,
  },
  joinedText: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 4,
  },
  editActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.brand600,
  },
  cancelActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate600,
  },
  editCard: {
    backgroundColor: palette.pureWhite,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: spacing.md,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  editButtonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  bioCard: {
    backgroundColor: palette.pureWhite,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: spacing.xs,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.slate700,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: palette.slate500,
  },
});
