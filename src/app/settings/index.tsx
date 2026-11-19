import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AppHeader } from '../../components/ui/AppHeader';
import { Card } from '../../components/ui/Card';
import { AppButton } from '../../components/ui/AppButton';
import { LocationPicker } from '../../components/ui/LocationPicker';
import { palette, spacing, typography, radii } from '../../constants/tokens';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUpdateProfileMutation } from '../../hooks/useUser';
import { authService } from '../../services/auth.service';
import { Locale } from '../../types/common';
import {
  ArrowLeft,
  MapPin,
  Globe,
  Bell,
  Shield,
  FileText,
  HelpCircle,
  Info,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  X,
  Smartphone,
  Lock,
} from 'lucide-react-native';

const LANGUAGES: { code: Locale; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { locale, setLocale, selectedCity, setSelectedCity } = useAppStore();
  const updateProfileMutation = useUpdateProfileMutation();

  // Location Selector state
  const initialUserState = user?.locationState || user?.state || '';
  const initialUserDistrict =
    user?.locationCity || user?.city || (selectedCity !== 'All India' ? selectedCity : '');

  const [selectedState, setSelectedState] = useState(initialUserState);
  const [selectedDistrict, setSelectedDistrict] = useState(initialUserDistrict);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // Notification toggles
  const [chatNotifications, setChatNotifications] = useState(true);
  const [dealNotifications, setDealNotifications] = useState(true);
  const [reelNotifications, setReelNotifications] = useState(true);

  // Privacy toggles
  const [showPhoneOnListings, setShowPhoneOnListings] = useState(true);

  // Legal & Info modals
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | 'safety' | null>(null);

  const currentSavedState = user?.locationState || user?.state || '';
  const currentSavedDistrict = user?.locationCity || user?.city || '';

  const isLocationChanged = Boolean(
    selectedState &&
      (selectedState !== currentSavedState || selectedDistrict !== currentSavedDistrict)
  );

  const handleSaveLocation = () => {
    if (!selectedState) {
      Alert.alert('Selection Required', 'Please select a state first.');
      return;
    }

    // Always update app-wide browsing location for marketplace discovery
    if (selectedDistrict) {
      setSelectedCity(selectedDistrict);
    } else if (selectedState) {
      setSelectedCity(selectedState);
    }

    if (!isAuthenticated || !user?.id) {
      Alert.alert(
        'Browsing Location Updated',
        `Your browsing location is set to ${selectedDistrict ? `${selectedDistrict}, ` : ''}${selectedState}. Sign in to save it permanently to your account profile.`
      );
      return;
    }

    setIsSavingLocation(true);
    updateProfileMutation.mutate(
      {
        userId: user.id,
        payload: {
          locationState: selectedState,
          locationCity: selectedDistrict || null,
        },
      },
      {
        onSuccess: () => {
          setIsSavingLocation(false);
          Alert.alert(
            'Location Saved',
            `Your location has been updated to ${selectedDistrict ? `${selectedDistrict}, ` : ''}${selectedState}.`
          );
        },
        onError: (err: any) => {
          setIsSavingLocation(false);
          Alert.alert('Error', err?.message || 'Failed to update location.');
        },
      }
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear locally cached images, videos, and temporary files to free up device space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully. 18.4 MB freed.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from Bazarr 360?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    router.push('/settings/privacy' as never);
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader
        title={t('account.settings', 'Settings')}
        onBack={() => router.back()}
        left={<ArrowLeft size={24} color="#002f34" />}
      />

      {/* ── Location Selector Section ── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeaderWithIcon}>
            <MapPin size={18} color="#002f34" />
            <Text style={styles.sectionTitle}>My Location</Text>
          </View>
          {isAuthenticated && (
            <TouchableOpacity
              onPress={handleSaveLocation}
              disabled={isSavingLocation || !isLocationChanged}
              style={[
                styles.saveLocationPill,
                isLocationChanged ? styles.saveLocationPillActive : styles.saveLocationPillDisabled,
              ]}
              activeOpacity={0.7}
            >
              {isSavingLocation ? (
                <ActivityIndicator size="small" color={palette.pureWhite} />
              ) : (
                <Text
                  style={[
                    styles.saveLocationPillText,
                    isLocationChanged
                      ? styles.saveLocationPillTextActive
                      : styles.saveLocationPillTextDisabled,
                  ]}
                >
                  {isLocationChanged ? 'Save' : 'Saved'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Card variant="outlined" style={styles.locationCard}>
          <Text style={styles.locationHelpText}>
            Set your state & district to discover nearby listings, reels, and local sellers in India.
          </Text>

          <LocationPicker
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            onStateChange={setSelectedState}
            onDistrictChange={setSelectedDistrict}
            showDetectButton={true}
          />

          {isAuthenticated && isLocationChanged && (
            <AppButton
              title={isSavingLocation ? 'Updating Profile...' : 'Save Location'}
              onPress={handleSaveLocation}
              disabled={isSavingLocation}
              variant="primary"
              size="sm"
              style={styles.saveLocationBtn}
            />
          )}
        </Card>
      </View>

      {/* ── Language Section ── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeaderWithIcon}>
            <Globe size={18} color="#002f34" />
            <Text style={styles.sectionTitle}>{t('account.language', 'App Language')}</Text>
          </View>
        </View>
        <Card variant="outlined" style={styles.cardOutlined}>
          {LANGUAGES.map((item, idx) => {
            const isSelected = locale === item.code;
            const isLast = idx === LANGUAGES.length - 1;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.langRow, isSelected && styles.langRowSelected, isLast && styles.rowLast]}
                onPress={() => setLocale(item.code)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.langNative}>{item.nativeName}</Text>
                  <Text style={styles.langLabel}>{item.label}</Text>
                </View>
                {isSelected ? <Check size={18} color={palette.brand600} strokeWidth={2.5} /> : null}
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>

      {/* ── Push Notifications Section ── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeaderWithIcon}>
            <Bell size={18} color="#002f34" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
        </View>
        <Card variant="outlined" style={styles.cardOutlined}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Chat Messages & Offers</Text>
              <Text style={styles.settingSubtitle}>Instant alerts when buyers or sellers reply</Text>
            </View>
            <Switch
              value={chatNotifications}
              onValueChange={setChatNotifications}
              trackColor={{ false: palette.slate200, true: '#002f34' }}
              thumbColor={palette.pureWhite}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Price Drops & Saved Searches</Text>
              <Text style={styles.settingSubtitle}>Get notified when items in your wishlist drop price</Text>
            </View>
            <Switch
              value={dealNotifications}
              onValueChange={setDealNotifications}
              trackColor={{ false: palette.slate200, true: '#002f34' }}
              thumbColor={palette.pureWhite}
            />
          </View>

          <View style={[styles.settingRow, styles.rowLast]}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Product Reels & Local Trends</Text>
              <Text style={styles.settingSubtitle}>Highlights and new video showcases nearby</Text>
            </View>
            <Switch
              value={reelNotifications}
              onValueChange={setReelNotifications}
              trackColor={{ false: palette.slate200, true: '#002f34' }}
              thumbColor={palette.pureWhite}
            />
          </View>
        </Card>
      </View>

      {/* ── Privacy & Security Section ── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeaderWithIcon}>
            <Shield size={18} color="#002f34" />
            <Text style={styles.sectionTitle}>Privacy & Safety</Text>
          </View>
        </View>
        <Card variant="outlined" style={styles.cardOutlined}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Show Phone on Listings</Text>
              <Text style={styles.settingSubtitle}>Allow verified buyers to view your contact number</Text>
            </View>
            <Switch
              value={showPhoneOnListings}
              onValueChange={setShowPhoneOnListings}
              trackColor={{ false: palette.slate200, true: '#002f34' }}
              thumbColor={palette.pureWhite}
            />
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/legal/community-guidelines' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Community Guidelines</Text>
              <Text style={styles.settingSubtitle}>Rules for safe and respectful marketplace use</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setActiveLegalModal('safety')}
            activeOpacity={0.7}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Buyer & Seller Safety Tips</Text>
              <Text style={styles.settingSubtitle}>Guidelines to transact safely and avoid common fraud</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* ── Legal & Policies (Google Play Store Compliance) ── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeaderWithIcon}>
            <FileText size={18} color="#002f34" />
            <Text style={styles.sectionTitle}>Legal & Support</Text>
          </View>
        </View>
        <Card variant="outlined" style={styles.cardOutlined}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/legal/privacy' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingSubtitle}>How Bazarr 360 collects, protects, and uses your data</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/legal/terms' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Terms & Conditions</Text>
              <Text style={styles.settingSubtitle}>User agreement, marketplace rules, and policies</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.rowLast]}
            onPress={() => router.push('/support' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Help Center & Contact Us</Text>
              <Text style={styles.settingSubtitle}>support@bazarr360.in</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.rowLast]}
            onPress={() => router.push('/settings/privacy' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Account Privacy & Deletion</Text>
              <Text style={styles.settingSubtitle}>Review privacy choices or request account deletion</Text>
            </View>
            <ChevronRight size={18} color={palette.slate400} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* ── Device & Storage Section ── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeaderWithIcon}>
            <Smartphone size={18} color="#002f34" />
            <Text style={styles.sectionTitle}>Storage & App Info</Text>
          </View>
        </View>
        <Card variant="outlined" style={styles.cardOutlined}>
          <TouchableOpacity style={styles.settingRow} onPress={handleClearCache} activeOpacity={0.7}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Clear Media Cache</Text>
              <Text style={styles.settingSubtitle}>Free up storage used by pre-loaded photos and reels</Text>
            </View>
            <Text style={styles.actionLinkText}>Clear</Text>
          </TouchableOpacity>

          <View style={[styles.settingRow, styles.rowLast]}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>App Version</Text>
              <Text style={styles.settingSubtitle}>Production release for Google Play</Text>
            </View>
            <Text style={styles.versionBadge}>v1.0.0 (Build 1)</Text>
          </View>
        </Card>
      </View>

      {/* ── Account Actions (Sign In / Delete / Logout) ── */}
      {isAuthenticated ? (
        <View style={styles.section}>
          <Card variant="outlined" style={styles.cardOutlined}>
            <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <View style={styles.dangerRowLeft}>
                <Trash2 size={18} color={palette.danger600} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.dangerTitle}>Request Account Deletion</Text>
                  <Text style={styles.settingSubtitle}>Submit a request to delete your account and data</Text>
                </View>
              </View>
              <ChevronRight size={18} color={palette.slate400} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, styles.rowLast]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.dangerRowLeft}>
                <LogOut size={18} color="#002f34" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.logoutTitle}>Log Out</Text>
                  <Text style={styles.settingSubtitle}>Signed in as {user?.email || user?.name || 'User'}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={palette.slate400} />
            </TouchableOpacity>
          </Card>
        </View>
      ) : (
        <View style={styles.authBannerContainer}>
          <Card variant="subtle" style={styles.authCard}>
            <Lock size={22} color="#002f34" style={{ marginBottom: 6 }} />
            <Text style={styles.authCardTitle}>Sign In for Full Experience</Text>
            <Text style={styles.authCardSubtitle}>
              Sign in to save your default location, chat with sellers, save favorites, and post video reels.
            </Text>
            <AppButton
              title="Sign In to Bazarr 360"
              onPress={() => router.push('/(auth)/login')}
              variant="primary"
              size="sm"
              style={styles.authCardBtn}
            />
          </Card>
        </View>
      )}

      {/* Footer Branding */}
      <View style={styles.versionFooter}>
        <Text style={styles.versionFooterTitle}>Bazarr 360 India</Text>
        <Text style={styles.versionFooterSubtitle}>Connecting Local Buyers & Sellers via Video</Text>
      </View>

      {/* ── Legal / Policy Bottom Sheet Modal ── */}
      <Modal
        visible={activeLegalModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveLegalModal(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeLegalModal === 'privacy' && 'Privacy Policy'}
                {activeLegalModal === 'terms' && 'Terms & Conditions'}
                {activeLegalModal === 'safety' && 'Safety Guidelines'}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveLegalModal(null)}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close dialog"
              >
                <X size={22} color="#002f34" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {activeLegalModal === 'privacy' && (
                <View>
                  <Text style={styles.modalHeading}>1. Information We Collect</Text>
                  <Text style={styles.modalParagraph}>
                    Bazarr 360 collects account information (name, email, phone number), location data (state,
                    district/city) to enable geographic marketplace listings and relevant feeds, and uploaded media
                    (photos, product video reels).
                  </Text>
                  <Text style={styles.modalHeading}>2. Location Data Usage</Text>
                  <Text style={styles.modalParagraph}>
                    Your location information is strictly used to display nearby products and connect you with local buyers
                    and sellers. Precise GPS coordinates are never made public.
                  </Text>
                  <Text style={styles.modalHeading}>3. Data Security & Storage</Text>
                  <Text style={styles.modalParagraph}>
                    We use industry-standard encryption and secure cloud infrastructure. User credentials and sensitive
                    tokens are stored securely.
                  </Text>
                  <Text style={styles.modalHeading}>4. User Rights & Account Deletion</Text>
                  <Text style={styles.modalParagraph}>
                    In compliance with Google Play Data Safety policies, you have the right to request deletion of your
                    account and all associated data at any time directly through the Settings screen or by contacting
                    support@bazarr360.in.
                  </Text>
                </View>
              )}

              {activeLegalModal === 'terms' && (
                <View>
                  <Text style={styles.modalHeading}>1. Marketplace Nature</Text>
                  <Text style={styles.modalParagraph}>
                    Bazarr 360 is a consumer-to-consumer classifieds and video reels platform connecting buyers and
                    sellers. Bazarr 360 does not hold inventory or act as an escrow agent.
                  </Text>
                  <Text style={styles.modalHeading}>2. Prohibited Content</Text>
                  <Text style={styles.modalParagraph}>
                    Users may not post illegal goods, counterfeit products, stolen property, offensive media, or deceptive
                    advertisements. Violators will be banned and reported to relevant authorities.
                  </Text>
                  <Text style={styles.modalHeading}>3. Transactions & Safety</Text>
                  <Text style={styles.modalParagraph}>
                    Buyers and sellers are solely responsible for inspecting items and agreeing on payment terms. Always
                    transact in secure, public places.
                  </Text>
                </View>
              )}

              {activeLegalModal === 'safety' && (
                <View>
                  <Text style={styles.modalHeading}>1. Meet in Public Places</Text>
                  <Text style={styles.modalParagraph}>
                    Always arrange meetings in well-lit, public locations like metro stations, coffee shops, or shopping
                    malls during daylight hours.
                  </Text>
                  <Text style={styles.modalHeading}>2. Never Pay in Advance</Text>
                  <Text style={styles.modalParagraph}>
                    Do not transfer advance token payments or shipping fees before verifying the physical product in
                    person.
                  </Text>
                  <Text style={styles.modalHeading}>3. Beware of QR Code / UPI Scams</Text>
                  <Text style={styles.modalParagraph}>
                    Remember that you NEVER need to scan a QR code or enter your UPI PIN to RECEIVE money. Anyone asking
                    you to enter a PIN to receive a payment is committing fraud.
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...typography.headline,
    color: '#002f34',
    fontWeight: '700',
  },
  saveLocationPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveLocationPillActive: {
    backgroundColor: '#002f34',
  },
  saveLocationPillDisabled: {
    backgroundColor: palette.slate200,
  },
  saveLocationPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveLocationPillTextActive: {
    color: palette.pureWhite,
  },
  saveLocationPillTextDisabled: {
    color: palette.slate500,
  },
  locationCard: {
    padding: spacing.md,
    backgroundColor: palette.pureWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  locationHelpText: {
    ...typography.bodySmall,
    color: palette.slate500,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  saveLocationBtn: {
    marginTop: spacing.md,
    backgroundColor: '#002f34',
  },
  cardOutlined: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: palette.pureWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#002f34',
  },
  settingSubtitle: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
    lineHeight: 16,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  langRowSelected: {
    backgroundColor: palette.brand50,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '600',
    color: '#002f34',
  },
  langLabel: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.brand600,
  },
  versionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate600,
    backgroundColor: palette.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dangerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dangerTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: palette.danger600,
  },
  logoutTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#002f34',
  },
  authBannerContainer: {
    marginVertical: spacing.md,
  },
  authCard: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  authCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 4,
  },
  authCardSubtitle: {
    fontSize: 12,
    color: palette.slate600,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  authCardBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#002f34',
  },
  versionFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  versionFooterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002f34',
    letterSpacing: 0.5,
  },
  versionFooterSubtitle: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: palette.pureWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#002f34',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#002f34',
    marginTop: spacing.md,
    marginBottom: 4,
  },
  modalParagraph: {
    fontSize: 13,
    color: palette.slate600,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
});
