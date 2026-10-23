import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { AppButton } from '../../components/ui/AppButton';
import { Badge } from '../../components/ui/Badge';
import { palette, radii, spacing, typography } from '../../constants/tokens';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useWishlistQuery } from '../../hooks/useWishlist';
import { useMyListingsQuery } from '../../hooks/useListings';
import { authService } from '../../services/auth.service';
import { formatCurrencyINR } from '../../utils/formatters';
import { Locale } from '../../types/common';

const LANGUAGES: { code: Locale; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale, setLocale } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();

  const { data: wishlistData } = useWishlistQuery();
  const { data: myListingsData } = useMyListingsQuery();

  const wishlistCount = wishlistData?.data?.length || 0;
  const myListingsCount = myListingsData?.data?.length || 0;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from Mandi Live?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
        },
      },
    ]);
  };

  return (
    <ScreenContainer scrollable hasBottomTab>
      {/* Top Header matching OLX reference */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('account.title', 'My Account')}</Text>
        {isAuthenticated && user && (
          <TouchableOpacity onPress={() => router.push(`/profile/${user.id}`)}>
            <Text style={styles.editProfileLink}>View & Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* User Profile Card */}
      <Card variant="elevated" style={styles.userCard}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {isAuthenticated && user?.name ? user.name[0].toUpperCase() : '👤'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {isAuthenticated && user?.name ? user.name : t('account.notLoggedIn', 'Guest User')}
            </Text>
            <Text style={styles.userStatus}>
              {isAuthenticated
                ? user?.email || user?.phone || 'Verified User'
                : 'Browse freely • Sign in to save & post'}
            </Text>
          </View>
        </View>

        {!isAuthenticated ? (
          <AppButton
            title={t('account.loginCta', 'Login / Register')}
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            size="md"
            style={styles.loginButton}
          />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{myListingsCount}</Text>
              <Text style={styles.statLabel}>My Ads</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{wishlistCount}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </View>
          </View>
        )}
      </Card>

      {/* ── My Listings / Products Management (Owner Only) ── */}
      {isAuthenticated && myListingsData?.data && myListingsData.data.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>📦 My Listed Products ({myListingsCount})</Text>
            <TouchableOpacity onPress={() => router.push('/listing/create')}>
              <Text style={styles.addNewProductLink}>+ New Ad</Text>
            </TouchableOpacity>
          </View>

          {myListingsData.data.map((item) => {
            const hasReel = item.reels && item.reels.length > 0;
            const primaryImg = item.media?.[0]?.url || item.media?.[0]?.thumbnailKey;

            return (
              <View key={item.id} style={styles.myListingCard}>
                <TouchableOpacity
                  style={styles.myListingMain}
                  onPress={() => router.push(`/listing/${item.id}`)}
                  activeOpacity={0.8}
                >
                  {primaryImg ? (
                    <Image source={{ uri: primaryImg }} style={styles.myListingThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.myListingNoThumb}>
                      <Text style={{ fontSize: 18 }}>📷</Text>
                    </View>
                  )}
                  <View style={styles.myListingInfo}>
                    <Text style={styles.myListingTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.myListingPrice}>{formatCurrencyINR(item.price)}</Text>
                    <View style={styles.myListingBadgeRow}>
                      <Badge label={item.status} variant={item.status === 'ACTIVE' ? 'success' : 'default'} />
                      {hasReel ? (
                        <Badge label="📹 REEL LIVE" variant="brand" style={{ marginLeft: 6 }} />
                      ) : (
                        <Badge label="NO REEL" variant="default" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Owner Actions for this product */}
                <View style={styles.myListingActions}>
                  <TouchableOpacity
                    style={styles.actionBtnEdit}
                    onPress={() => router.push(`/listing/edit/${item.id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnEditText}>✏️ Edit Product</Text>
                  </TouchableOpacity>

                  {!hasReel ? (
                    <TouchableOpacity
                      style={styles.actionBtnAddReel}
                      onPress={() => router.push(`/listing/edit/${item.id}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnAddReelText}>📹 + Add Reel</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionBtnView}
                      onPress={() => router.push(`/listing/${item.id}`)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnViewText}>👁️ View</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Account Menu Items matching reference */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/(auth)/login');
            } else {
              router.push('/search');
            }
          }}
        >
          <Text style={styles.menuIcon}>❤️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Wishlist</Text>
            <Text style={styles.menuSubtitle}>{wishlistCount} saved items</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/chats')}
        >
          <Text style={styles.menuIcon}>✉️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>My Chats</Text>
            <Text style={styles.menuSubtitle}>Buyer and seller conversations</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{t('account.settings', 'Settings')}</Text>
            <Text style={styles.menuSubtitle}>Privacy, notifications and network</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Language Switcher Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account.language', 'App Language')}</Text>
        <View style={styles.languageContainer}>
          {LANGUAGES.map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  isSelected && styles.languageOptionSelected,
                ]}
                onPress={() => setLocale(lang.code)}
              >
                <Text
                  style={[
                    styles.languageNative,
                    isSelected && styles.languageTextSelected,
                  ]}
                >
                  {lang.nativeName}
                </Text>
                <Text
                  style={[
                    styles.languageLabel,
                    isSelected && styles.languageTextSelected,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Logout Action */}
      {isAuthenticated && (
        <View style={styles.logoutSection}>
          <AppButton
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            size="md"
            style={styles.logoutBtn}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#002f34',
  },
  editProfileLink: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.brand600,
  },
  userCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#ffce32',
    backgroundColor: palette.pureWhite,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: palette.brand300,
  },
  avatarText: {
    fontSize: 22,
    color: palette.brand600,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.slate900,
  },
  userStatus: {
    ...typography.caption,
    color: palette.slate500,
    marginTop: 2,
  },
  loginButton: {
    marginTop: spacing.md,
    backgroundColor: '#002f34',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
  },
  statLabel: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: palette.slate200,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.slate100,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate800,
  },
  menuSubtitle: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 18,
    color: palette.slate400,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
  },
  languageOptionSelected: {
    borderColor: '#002f34',
    backgroundColor: palette.brand50,
  },
  languageNative: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate800,
  },
  languageLabel: {
    fontSize: 10,
    color: palette.slate500,
    marginTop: 2,
  },
  languageTextSelected: {
    color: '#002f34',
  },
  logoutSection: {
    marginVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  logoutBtn: {
    borderColor: palette.danger500,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  addNewProductLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002f34',
  },
  myListingCard: {
    backgroundColor: palette.pureWhite,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  myListingMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myListingThumb: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    marginRight: spacing.md,
  },
  myListingNoThumb: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  myListingInfo: {
    flex: 1,
  },
  myListingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  myListingPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002f34',
    marginTop: 2,
  },
  myListingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  myListingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  actionBtnEdit: {
    flex: 1,
    backgroundColor: '#002f34',
    paddingVertical: 7,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  actionBtnEditText: {
    color: palette.pureWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnAddReel: {
    flex: 1,
    backgroundColor: '#f0f9f8',
    borderWidth: 1,
    borderColor: '#002f34',
    paddingVertical: 7,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  actionBtnAddReelText: {
    color: '#002f34',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnView: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.md,
    backgroundColor: palette.slate100,
    alignItems: 'center',
  },
  actionBtnViewText: {
    color: palette.slate700,
    fontSize: 12,
    fontWeight: '600',
  },
});
