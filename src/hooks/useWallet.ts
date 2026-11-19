import { useQuery } from '@tanstack/react-query';
import { walletService } from '../services/wallet.service';
import { useAuthStore } from '../stores/useAuthStore';

export const WALLET_QUERY_KEYS = {
  all: ['wallet'] as const,
  balance: (userId?: string | null) =>
    [...WALLET_QUERY_KEYS.all, 'balance', userId ?? 'anonymous'] as const,
  transactions: (userId?: string | null, page = 1, limit = 20) =>
    [...WALLET_QUERY_KEYS.all, 'transactions', userId ?? 'anonymous', page, limit] as const,
};

export const useWalletBalanceQuery = () => {
  const { user, isAuthenticated } = useAuthStore();
  const userId = isAuthenticated ? user?.id : null;

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.balance(userId),
    queryFn: () => walletService.getBalance(),
    enabled: Boolean(isAuthenticated && userId),
    staleTime: 1000 * 30, // 30 seconds fresh cache
  });
};

export const useWalletTransactionsQuery = (page = 1, limit = 20) => {
  const { user, isAuthenticated } = useAuthStore();
  const userId = isAuthenticated ? user?.id : null;

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.transactions(userId, page, limit),
    queryFn: () => walletService.getTransactions(page, limit),
    enabled: Boolean(isAuthenticated && userId),
    staleTime: 1000 * 30,
  });
};
