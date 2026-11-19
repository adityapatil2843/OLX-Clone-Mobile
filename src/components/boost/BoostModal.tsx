import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing } from '../../constants/tokens';
import { AdTargetType } from '../../services/boost.service';
import {
  useBoostPackagesQuery,
  useCreateBoostMutation,
} from '../../hooks/useBoost';
import { useWalletBalanceQuery } from '../../hooks/useWallet';
import { X, Zap, Coins, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';

export interface BoostModalTarget {
  type: AdTargetType;
  id: string;
  title: string;
}

export interface BoostModalProps {
  visible: boolean;
  onClose: () => void;
  target: BoostModalTarget | null;
  onSuccess?: () => void;
}

export const BoostModal: React.FC<BoostModalProps> = ({
  visible,
  onClose,
  target,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: packages, isLoading: isPackagesLoading } = useBoostPackagesQuery();
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useWalletBalanceQuery();
  const createBoostMutation = useCreateBoostMutation();

  const userCoins = balanceData?.coinsBalance ?? 0;
  const selectedPackage = packages?.find((p) => p.id === selectedPackageId);
  const canAffordSelected = selectedPackage ? userCoins >= selectedPackage.coinsCost : true;
  const deficit = selectedPackage ? Math.max(0, selectedPackage.coinsCost - userCoins) : 0;

  const resetState = () => {
    setSelectedPackageId(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleConfirmBoost = () => {
    if (!target || !selectedPackage) return;

    if (userCoins < selectedPackage.coinsCost) {
      setErrorMessage(
        `Insufficient coins. You have ${userCoins} coins, but this package requires ${selectedPackage.coinsCost} coins.`
      );
      return;
    }

    setErrorMessage(null);

    // Generate random UUID v4 string for idempotencyKey
    const idempotencyKey = 'idemp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

    createBoostMutation.mutate(
      {
        targetType: target.type,
        targetId: target.id,
        packageId: selectedPackage.id,
        idempotencyKey,
      },
      {
        onSuccess: () => {
          setSuccessMessage(
            `"${target.title}" is now successfully boosted for ${selectedPackage.durationDays} days!`
          );
          refetchBalance();
          onSuccess?.();
        },
        onError: (err: any) => {
          // Immediately synchronize balance with authoritative backend state
          refetchBalance();
          const msg = err?.message || 'Failed to activate boost';
          if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already active')) {
            setErrorMessage('This item already has an active boost running.');
          } else if (msg.toLowerCase().includes('coins') || msg.toLowerCase().includes('balance')) {
            setErrorMessage('Insufficient coin balance to activate this package.');
          } else if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('inactive')) {
            setErrorMessage('This boost package or item is no longer eligible for boosting.');
          } else {
            setErrorMessage(msg);
          }
        },
      }
    );
  };

  if (!visible || !target) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.zapCircle}>
                <Zap size={18} color="#002f34" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Boost Your {target.type === 'LISTING' ? 'Ad' : 'Reel'}</Text>
                <Text style={styles.targetTitle} numberOfLines={1}>
                  {target.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color="#002f34" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* User Coin Balance Header */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceInfo}>
                <Coins size={20} color="#ffce32" />
                <Text style={styles.balanceLabel}>Available Coin Balance:</Text>
              </View>
              {isBalanceLoading ? (
                <ActivityIndicator size="small" color="#002f34" />
              ) : isBalanceError ? (
                <TouchableOpacity onPress={() => refetchBalance()} style={styles.balanceRetryBtn}>
                  <Text style={styles.balanceRetryText}>Retry</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.balanceValue}>{userCoins} Coins</Text>
              )}
            </View>

            {/* Error Message Box */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={palette.danger600} style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Success Message Box */}
            {successMessage && (
              <View style={styles.successBox}>
                <CheckCircle size={22} color="#002f34" style={{ marginBottom: 6 }} />
                <Text style={styles.successTitle}>Boost Activated!</Text>
                <Text style={styles.successText}>{successMessage}</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {!successMessage && (
              <>
                <Text style={styles.sectionHeading}>Choose a Boost Package</Text>

                {isPackagesLoading ? (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="#002f34" />
                    <Text style={styles.loadingText}>Loading boost packages...</Text>
                  </View>
                ) : !packages || packages.length === 0 ? (
                  <View style={styles.emptyPackages}>
                    <Clock size={32} color={palette.slate400} style={{ marginBottom: 6 }} />
                    <Text style={styles.emptyPackagesText}>No active boost packages available right now.</Text>
                  </View>
                ) : (
                  packages.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    const canAfford = userCoins >= pkg.coinsCost;

                    return (
                      <TouchableOpacity
                        key={pkg.id}
                        testID={`package-card-${pkg.id}`}
                        style={[
                          styles.packageCard,
                          isSelected && styles.packageCardSelected,
                          !canAfford && styles.packageCardDisabled,
                        ]}
                        onPress={() => {
                          setSelectedPackageId(pkg.id);
                          setErrorMessage(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.pkgRadio}>
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}
                          >
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                        </View>

                        <View style={styles.pkgInfo}>
                          <Text style={styles.pkgName}>{pkg.name}</Text>
                          <Text style={styles.pkgDuration}>
                            Featured for {pkg.durationDays} Days across marketplace
                          </Text>
                        </View>

                        <View style={styles.pkgPrice}>
                          <Text style={styles.pkgCoins}>{pkg.coinsCost}</Text>
                          <Text style={styles.pkgCoinsLabel}>coins</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                {/* Boost explanation callout */}
                <View style={styles.boostNotice}>
                  <Text style={styles.boostNoticeText}>
                    ✨ Boosted listings and reels appear at the top of category searches and reels feed with a Sponsored badge.
                  </Text>
                </View>

                {/* Purchase Confirmation Details */}
                {selectedPackage && (
                  <View style={styles.confirmationBox}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Package:</Text>
                      <Text style={styles.summaryValue}>{selectedPackage.name}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Duration:</Text>
                      <Text style={styles.summaryValue}>{selectedPackage.durationDays} Days</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Current Balance:</Text>
                      <Text style={styles.summaryValue}>{userCoins} Coins</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Package Cost:</Text>
                      <Text style={[styles.summaryValue, { color: '#002f34', fontWeight: '800' }]}>
                        {selectedPackage.coinsCost} Coins
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Estimated Remaining:</Text>
                      {canAffordSelected ? (
                        <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '700' }]}>
                          {userCoins - selectedPackage.coinsCost} Coins
                        </Text>
                      ) : (
                        <Text style={[styles.summaryValue, { color: palette.danger600, fontWeight: '700' }]}>
                          Insufficient (-{deficit} Coins)
                        </Text>
                      )}
                    </View>

                    {/* Insufficient Coins Warning Callout */}
                    {!canAffordSelected && (
                      <View style={styles.insufficientNoticeBox}>
                        <AlertCircle size={16} color={palette.danger600} style={{ marginRight: 6 }} />
                        <Text style={styles.insufficientNoticeText}>
                          You need {deficit} more coins to activate this boost. Your current balance is {userCoins} coins.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Action CTA Button */}
                <TouchableOpacity
                  testID="boost-submit-btn"
                  style={[
                    styles.boostButton,
                    (!selectedPackageId || !canAffordSelected || createBoostMutation.isPending) &&
                      styles.boostButtonDisabled,
                  ]}
                  onPress={handleConfirmBoost}
                  disabled={!selectedPackageId || !canAffordSelected || createBoostMutation.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={
                    !selectedPackage
                      ? 'Select a package to continue'
                      : !canAffordSelected
                      ? `Insufficient coins. Need ${deficit} more coins.`
                      : `Activate boost for ${selectedPackage.coinsCost} coins`
                  }
                >
                  {createBoostMutation.isPending ? (
                    <ActivityIndicator size="small" color={palette.pureWhite} />
                  ) : (
                    <View style={styles.btnContent}>
                      <Zap size={16} color={palette.pureWhite} style={{ marginRight: 6 }} />
                      <Text style={styles.boostButtonText}>
                        {!selectedPackage
                          ? 'Select a Package'
                          : !canAffordSelected
                          ? `Insufficient Coins (Need ${deficit} More)`
                          : `Activate Boost for ${selectedPackage.coinsCost} Coins`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: palette.pureWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  zapCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffce32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
  },
  targetTitle: {
    fontSize: 12,
    color: palette.slate500,
    maxWidth: 220,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f5',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate700,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
  },
  balanceRetryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: palette.danger50,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  balanceRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.danger600,
  },
  insufficientNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  insufficientNoticeText: {
    flex: 1,
    fontSize: 12,
    color: palette.danger600,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: spacing.sm,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    marginBottom: spacing.sm,
    backgroundColor: palette.pureWhite,
  },
  packageCardSelected: {
    borderColor: '#002f34',
    backgroundColor: palette.brand50,
  },
  packageCardDisabled: {
    opacity: 0.6,
  },
  pkgRadio: {
    marginRight: spacing.md,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.slate400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#002f34',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#002f34',
  },
  pkgInfo: {
    flex: 1,
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  pkgDuration: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
  },
  pkgPrice: {
    alignItems: 'flex-end',
  },
  pkgCoins: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002f34',
  },
  pkgCoinsLabel: {
    fontSize: 10,
    color: palette.slate500,
    fontWeight: '600',
  },
  boostNotice: {
    backgroundColor: '#f0f9f8',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#23e5db',
    marginVertical: spacing.sm,
  },
  boostNoticeText: {
    fontSize: 12,
    color: '#002f34',
    lineHeight: 16,
  },
  confirmationBox: {
    backgroundColor: palette.slate50,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.slate600,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate900,
  },
  boostButton: {
    backgroundColor: '#002f34',
    paddingVertical: 13,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  boostButtonDisabled: {
    backgroundColor: palette.slate300,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boostButtonText: {
    color: palette.pureWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.danger50,
    borderWidth: 1,
    borderColor: palette.danger500,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: palette.danger600,
    lineHeight: 16,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 6,
  },
  successText: {
    fontSize: 13,
    color: palette.slate600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  doneBtn: {
    backgroundColor: '#002f34',
    paddingVertical: 10,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.full,
  },
  doneBtnText: {
    color: palette.pureWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  centerLoading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: palette.slate500,
    marginTop: 8,
  },
  emptyPackages: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyPackagesText: {
    fontSize: 12,
    color: palette.slate500,
  },
});
