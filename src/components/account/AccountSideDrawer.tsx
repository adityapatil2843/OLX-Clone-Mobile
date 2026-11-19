import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette, radii, spacing } from '../../constants/tokens';
import { UserProfile } from '../../types/user';
import { useAppStore } from '../../stores/useAppStore';
import { authService } from '../../services/auth.service';
import { useWalletBalanceQuery } from '../../hooks/useWallet';
import { Locale } from '../../types/common';
import {
  X,
  User,
  Edit3,
  Package,
  Clapperboard,
  Heart,
  Zap,
  Coins,
  Settings,
  Globe,
  HelpCircle,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react-native';

export interface AccountSideDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  isAuthenticated: boolean;
  onSelectTab?: (tab: 'listings' | 'reels' | 'saved') => void;
}

const LANGUAGES: { code: Locale; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];

export const AccountSideDrawer: React.FC<AccountSideDrawerProps> = ({
  visible,
  onClose,
  user,
  isAuthenticated,
  onSelectTab,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { locale, setLocale } = useAppStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { data: balanceData, isLoading: isBalanceLoading } = useWalletBalanceQuery();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from Bazarr 360?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          onClose();
          await authService.logout();
        },
      },
    ]);
  };

  const navigateTo = (path: string) => {
    onClose();
    router.push(path as never);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          {/* Backdrop clickable */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />

          {/* Drawer content pane (slides in from right) */}
          <View
            style={[
              styles.drawerPane,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Header */}
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerTitle}>Account Menu</Text>
                {isAuthenticated && user && (
                  <Text style={styles.drawerUserEmail} numberOfLines={1}>
                    {user.email || user.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityLabel="Close drawer"
              >
                <X size={22} color="#002f34" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
              {/* Group: Profile */}
              {isAuthenticated && user && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Profile</Text>
                  <View style={styles.groupCard}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => navigateTo(`/profile/${user.id}`)}
                    >
                      <View style={styles.iconCircle}>
                        <User size={18} color="#002f34" />
                      </View>
                      <Text style={styles.menuItemText}>View Profile</Text>
                      <ChevronRight size={18} color={palette.slate400} />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => navigateTo(`/profile/${user.id}?edit=true`)}
                    >
                      <View style={styles.iconCircle}>
                        <Edit3 size={18} color="#002f34" />
                      </View>
                      <Text style={styles.menuItemText}>Edit Profile</Text>
                      <ChevronRight size={18} color={palette.slate400} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Group: My Activity */}
              {isAuthenticated && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>My Activity</Text>
                  <View style={styles.groupCard}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        onClose();
                        onSelectTab?.('listings');
                      }}
                    >
                      <View style={styles.iconCircle}>
                        <Package size={18} color="#002f34" />
                      </View>
                      <Text style={styles.menuItemText}>My Listings</Text>
                      <ChevronRight size={18} color={palette.slate400} />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        onClose();
                        onSelectTab?.('reels');
                      }}
                    >
                      <View style={styles.iconCircle}>
                        <Clapperboard size={18} color="#002f34" />
                      </View>
                      <Text style={styles.menuItemText}>My Reels</Text>
                      <ChevronRight size={18} color={palette.slate400} />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        onClose();
                        onSelectTab?.('saved');
                      }}
                    >
                      <View style={styles.iconCircle}>
                        <Heart size={18} color="#002f34" />
                      </View>
                      <Text style={styles.menuItemText}>Saved / Wishlist</Text>
                      <ChevronRight size={18} color={palette.slate400} />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => navigateTo('/boosted-content')}
                    >
                      <View style={styles.iconCircle}>
                        <Zap size={18} color="#002f34" />
                      </View>
                      <Text style={styles.menuItemText}>Boosted Content</Text>
                      <ChevronRight size={18} color={palette.slate400} />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => navigateTo('/wallet')}
                    >
                      <View style={styles.iconCircle}>
                        <Coins size={18} color="#002f34" />
                      </View>
                      <View style={styles.menuItemWithBadge}>
                        <Text style={styles.menuItemText}>Wallet & Coins</Text>
                        {isBalanceLoading ? (
                          <ActivityIndicator size="small" color="#002f34" />
                        ) : (
                          <View style={styles.drawerCoinBadge}>
                            <Text style={styles.drawerCoinBadgeText}>
                              {balanceData?.coinsBalance ?? 0}
                            </Text>
                          </View>
                        )}
                      </View>
                      <ChevronRight size={18} color={palette.slate400} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Group: Preferences */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigateTo('/settings')}
                  >
                    <View style={styles.iconCircle}>
                      <Settings size={18} color="#002f34" />
                    </View>
                    <Text style={styles.menuItemText}>{t('account.settings', 'Settings')}</Text>
                    <ChevronRight size={18} color={palette.slate400} />
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setShowLanguageModal(true)}
                  >
                    <View style={styles.iconCircle}>
                      <Globe size={18} color="#002f34" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuItemText}>{t('account.language', 'Language')}</Text>
                      <Text style={styles.menuItemSubtext}>
                        {LANGUAGES.find((l) => l.code === locale)?.label || 'English'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={palette.slate400} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Group: Support */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigateTo('/support')}
                  >
                    <View style={styles.iconCircle}>
                      <HelpCircle size={18} color="#002f34" />
                    </View>
                    <Text style={styles.menuItemText}>Help & FAQ</Text>
                    <ChevronRight size={18} color={palette.slate400} />
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      Alert.alert(
                        'Report a Problem',
                        'In-app automated reporting is coming soon. Please write directly to support@bazarr360.in.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Help Center', onPress: () => navigateTo('/support') },
                        ]
                      );
                    }}
                  >
                    <View style={styles.iconCircle}>
                      <AlertTriangle size={18} color="#002f34" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuItemText}>Report a Problem</Text>
                      <Text style={styles.comingSoonBadge}>Coming Soon</Text>
                    </View>
                    <ChevronRight size={18} color={palette.slate400} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Group: Session */}
              {isAuthenticated && (
                <View style={[styles.section, { marginBottom: spacing.xl }]}>
                  <View style={styles.groupCard}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleLogout}
                    >
                      <View style={[styles.iconCircle, { backgroundColor: palette.danger50 }]}>
                        <LogOut size={18} color={palette.danger600} />
                      </View>
                      <Text style={[styles.menuItemText, { color: palette.danger600 }]}>
                        Log Out
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.langOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}
          />
          <View
            style={[
              styles.langSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetDragBar} />
            <Text style={styles.sheetTitle}>Select Language</Text>

            {LANGUAGES.map((item) => {
              const isSelected = locale === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.langOption, isSelected && styles.langOptionSelected]}
                  onPress={() => {
                    setLocale(item.code);
                    setShowLanguageModal(false);
                  }}
                >
                  <View>
                    <Text style={styles.langOptionNative}>{item.nativeName}</Text>
                    <Text style={styles.langOptionLabel}>{item.label}</Text>
                  </View>
                  {isSelected && <Check size={20} color="#002f34" strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  drawerPane: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: palette.pureWhite,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002f34',
  },
  drawerUserEmail: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
    maxWidth: 220,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: palette.pureWhite,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#002f34',
  },
  menuItemWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  drawerCoinBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  drawerCoinBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  menuItemSubtext: {
    fontSize: 11,
    color: palette.slate500,
  },
  comingSoonBadge: {
    fontSize: 10,
    color: palette.brand600,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: palette.slate100,
    marginLeft: 56,
  },
  langOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  langSheet: {
    backgroundColor: palette.pureWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.slate300,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: spacing.md,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginBottom: spacing.sm,
  },
  langOptionSelected: {
    borderColor: '#002f34',
    backgroundColor: palette.brand50,
  },
  langOptionNative: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
  },
  langOptionLabel: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 2,
  },
});
