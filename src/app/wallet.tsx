import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { AppHeader } from '../components/ui/AppHeader';
import { palette, radii, spacing } from '../constants/tokens';
import {
  useWalletBalanceQuery,
  useWalletTransactionsQuery,
} from '../hooks/useWallet';
import { CoinTransaction } from '../services/wallet.service';
import { formatRelativeTime } from '../utils/formatters';
import {
  Coins,
  ArrowLeft,
  ArrowDownLeft,
  Gift,
  Zap,
  RotateCcw,
  Clock,
} from 'lucide-react-native';

export default function WalletScreen() {
  const router = useRouter();

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useWalletBalanceQuery();

  const {
    data: transactionsData,
    isLoading: isTxLoading,
    isRefetching,
    refetch: refetchTransactions,
  } = useWalletTransactionsQuery(1, 30);

  const coinsBalance = balanceData?.coinsBalance ?? 0;
  const transactions = transactionsData?.data || [];

  const handleRefreshAll = () => {
    refetchBalance();
    refetchTransactions();
  };

  const renderTransactionIcon = (type: string) => {
    switch (type) {
      case 'WELCOME_BONUS':
        return <Gift size={18} color="#22c55e" />;
      case 'BOOST_SPENT':
        return <Zap size={18} color="#eab308" />;
      case 'REFUND':
        return <RotateCcw size={18} color="#3b82f6" />;
      case 'PURCHASE':
        return <ArrowDownLeft size={18} color="#22c55e" />;
      default:
        return <Coins size={18} color="#002f34" />;
    }
  };

  const renderTransactionItem = ({ item }: { item: CoinTransaction }) => {
    const isPositive = item.amount > 0;

    return (
      <View style={styles.txRow}>
        <View
          style={[
            styles.txIconCircle,
            isPositive ? styles.txIconCircleGreen : styles.txIconCircleGold,
          ]}
        >
          {renderTransactionIcon(item.type)}
        </View>

        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>
            {item.reason || item.type.replace('_', ' ')}
          </Text>
          <Text style={styles.txDate}>{formatRelativeTime(item.createdAt)}</Text>
        </View>

        <View style={styles.txAmountCol}>
          <Text
            style={[
              styles.txAmountText,
              isPositive ? styles.txAmountPositive : styles.txAmountNegative,
            ]}
          >
            {isPositive ? `+${item.amount}` : item.amount}
          </Text>
          <Text style={styles.txBalanceAfter}>Bal: {item.balanceAfter}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader
        title="Wallet & Coins"
        onBack={() => router.back()}
        left={<ArrowLeft size={24} color="#002f34" />}
      />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefreshAll}
            colors={['#002f34']}
          />
        }
        ListHeaderComponent={
          <>
            {/* Hero Coin Balance Card */}
            <View style={styles.balanceHeroCard}>
              <View style={styles.coinBadge}>
                <Coins size={28} color="#ffce32" />
              </View>
              <Text style={styles.heroCoinsLabel}>Total Available Coins</Text>
              {isBalanceLoading ? (
                <ActivityIndicator size="small" color="#002f34" style={{ marginVertical: 8 }} />
              ) : (
                <Text style={styles.heroCoinsNumber}>{coinsBalance}</Text>
              )}
              <Text style={styles.heroCoinsDesc}>
                Use coins to boost your listings and reels to the top of search results.
              </Text>
            </View>

            {/* Transactions Header */}
            <View style={styles.sectionHeaderRow}>
              <Clock size={16} color="#002f34" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Coin History</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isTxLoading ? (
            <View style={styles.centeredLoading}>
              <ActivityIndicator size="large" color="#002f34" />
              <Text style={styles.emptyText}>Loading transaction history...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Coins size={44} color={palette.slate300} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No coin transactions yet</Text>
              <Text style={styles.emptyText}>
                Your welcome bonus and boost deductions will appear here.
              </Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xxl,
  },
  balanceHeroCard: {
    backgroundColor: palette.pureWhite,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffce32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  coinBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroCoinsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate500,
  },
  heroCoinsNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#002f34',
    marginVertical: 4,
  },
  heroCoinsDesc: {
    fontSize: 12,
    color: palette.slate600,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.pureWhite,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txIconCircleGreen: {
    backgroundColor: '#ecfdf5',
  },
  txIconCircleGold: {
    backgroundColor: '#fefce8',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: palette.slate900,
  },
  txDate: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  txAmountPositive: {
    color: '#16a34a',
  },
  txAmountNegative: {
    color: palette.danger600,
  },
  txBalanceAfter: {
    fontSize: 10,
    color: palette.slate400,
    marginTop: 2,
  },
  centeredLoading: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate800,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: palette.slate500,
    textAlign: 'center',
    lineHeight: 16,
  },
});
