import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { Badge } from '../../components/ui/Badge';
import { palette, radii, spacing } from '../../constants/tokens';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUserProfileQuery, useUpdateProfileMutation } from '../../hooks/useUser';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const isSelf = id === 'self' || id === currentUser?.id;
  const targetUserId = isSelf ? (currentUser?.id || '') : (id || '');

  const { data: profile, isLoading } = useUserProfileQuery(targetUserId);
  const updateProfileMutation = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const displayedUser = profile || (isSelf ? currentUser : null);

  const handleStartEdit = () => {
    if (displayedUser) {
      setName(displayedUser.name || '');
      setBio(displayedUser.bio || '');
      setCity(displayedUser.locationCity || displayedUser.city || '');
      setState(displayedUser.locationState || displayedUser.state || '');
    }
    setIsEditing(true);
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
        title={isSelf ? 'My Profile' : 'Seller Profile'}
        onBack={() => router.back()}
        rightAction={
          isSelf && !isEditing ? (
            <TouchableOpacity onPress={handleStartEdit}>
              <Text style={styles.editActionText}>Edit</Text>
            </TouchableOpacity>
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
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {displayedUser?.name ? displayedUser.name[0].toUpperCase() : '👤'}
              </Text>
            </View>

            <View style={styles.profileHeaderInfo}>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.profileName}>{displayedUser?.name || 'User'}</Text>
                {displayedUser?.isVerifiedSeller && (
                  <Badge label="VERIFIED SELLER" variant="brand" />
                )}
              </View>
              <Text style={styles.locationText}>
                📍 {[displayedUser?.locationCity || displayedUser?.city, displayedUser?.locationState || displayedUser?.state].filter(Boolean).join(', ') || 'India'}
              </Text>
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
              <AppInput label="Full Name" value={name} onChangeText={setName} />
              <AppInput
                label="About You / Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell buyers about yourself or your business..."
                multiline
                numberOfLines={3}
              />
              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <AppInput label="City" value={city} onChangeText={setCity} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput label="State" value={state} onChangeText={setState} />
                </View>
              </View>

              <View style={styles.editButtonRow}>
                <AppButton
                  title="Cancel"
                  onPress={() => setIsEditing(false)}
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
    marginBottom: spacing.sm,
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
