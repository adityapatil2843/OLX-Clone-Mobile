import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { optimizeCloudinaryUrl } from '../../utils/cloudinary';
import { palette, radii, spacing } from '../../constants/tokens';
import { UserProfile } from '../../types/user';
import { Badge } from '../ui/Badge';
import { Menu, MapPin, Edit3, Mail, Phone, Coins } from 'lucide-react-native';
import { useWalletBalanceQuery } from '../../hooks/useWallet';

export interface AccountHeaderProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  onEditProfile: () => void;
  onOpenDrawer: () => void;
  onLoginPress: () => void;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({
  user,
  isAuthenticated,
  onEditProfile,
  onOpenDrawer,
  onLoginPress,
}) => {
  const router = useRouter();
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useWalletBalanceQuery();
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.brandTitle}>Account</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onOpenDrawer}
            accessibilityLabel="Open menu"
          >
            <Menu size={22} color="#002f34" />
          </TouchableOpacity>
        </View>

        <View style={styles.guestCard}>
          <View style={styles.guestAvatar}>
            <Text style={styles.guestAvatarText}>👤</Text>
          </View>
          <View style={styles.guestInfo}>
            <Text style={styles.guestTitle}>Welcome to Bazarr 360</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to manage your listings, reels, and saved items.
            </Text>
            <TouchableOpacity style={styles.guestLoginBtn} onPress={onLoginPress}>
              <Text style={styles.guestLoginBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const location = [user.locationCity || user.city, user.locationState || user.state]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      {/* Top bar with screen title & hamburger drawer button */}
      <View style={styles.topRow}>
        <View style={styles.nameVerifiedRow}>
          <Text style={styles.userNameHeader} numberOfLines={1}>
            {user.name || 'My Profile'}
          </Text>
          {user.isVerifiedSeller && (
            <Badge label="VERIFIED" variant="brand" style={{ marginLeft: 6 }} />
          )}
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onOpenDrawer}
          accessibilityLabel="Open account drawer"
        >
          <Menu size={24} color="#002f34" />
        </TouchableOpacity>
      </View>

      {/* Main Profile Info Row (Instagram-inspired avatar + user details) */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          {user.avatarUrl ? (
            <ExpoImage
              source={{ uri: optimizeCloudinaryUrl(user.avatarUrl) }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.profileDetails}>
          <Text style={styles.fullName}>{user.name || 'User'}</Text>

          {user.email ? (
            <View style={styles.detailRow}>
              <Mail size={13} color={palette.slate500} />
              <Text style={styles.detailText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          ) : user.phone ? (
            <View style={styles.detailRow}>
              <Phone size={13} color={palette.slate500} />
              <Text style={styles.detailText} numberOfLines={1}>
                {user.phone}
              </Text>
            </View>
          ) : null}

          {location ? (
            <View style={styles.detailRow}>
              <MapPin size={13} color="#002f34" />
              <Text style={styles.detailText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}

          {user.bio ? (
            <Text style={styles.bioText} numberOfLines={2}>
              {user.bio}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action Buttons Row with Edit Profile & Wallet Balance Pill */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={onEditProfile}
          activeOpacity={0.8}
        >
          <Edit3 size={15} color="#002f34" style={{ marginRight: 6 }} />
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.walletPillBtn}
          onPress={() => {
            if (isBalanceError) {
              refetchBalance();
            } else {
              router.push('/wallet');
            }
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            isBalanceLoading
              ? 'Loading wallet balance'
              : isBalanceError
              ? 'Wallet balance error. Tap to retry.'
              : `Wallet balance: ${balanceData?.coinsBalance ?? 0} coins. Tap to view wallet.`
          }
        >
          <View style={styles.coinIconCircle}>
            <Coins size={14} color="#b45309" />
          </View>
          {isBalanceLoading ? (
            <ActivityIndicator size="small" color="#002f34" style={{ marginHorizontal: 4 }} />
          ) : isBalanceError ? (
            <Text style={styles.walletRetryText}>Retry Coins</Text>
          ) : (
            <View style={styles.walletTextRow}>
              <Text style={styles.walletBalanceNumber}>
                {balanceData?.coinsBalance ?? 0}
              </Text>
              <Text style={styles.walletBalanceUnit}>Coins</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.pureWhite,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#002f34',
  },
  userNameHeader: {
    fontSize: 19,
    fontWeight: '800',
    color: '#002f34',
    maxWidth: 240,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  avatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#002f34',
    overflow: 'hidden',
    backgroundColor: palette.brand50,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brand50,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '800',
    color: '#002f34',
  },
  profileDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.slate900,
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: palette.slate600,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 12,
    color: palette.slate600,
    marginTop: 4,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.slate100,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002f34',
  },
  walletPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    gap: 6,
  },
  coinIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  walletBalanceNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
  },
  walletBalanceUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  walletRetryText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.danger600,
  },
  guestCard: {
    padding: spacing.md,
    backgroundColor: palette.slate50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  guestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatarText: {
    fontSize: 24,
  },
  guestInfo: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
  },
  guestSubtitle: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
    marginBottom: 8,
  },
  guestLoginBtn: {
    backgroundColor: '#002f34',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  guestLoginBtnText: {
    color: palette.pureWhite,
    fontSize: 12,
    fontWeight: '700',
  },
});
