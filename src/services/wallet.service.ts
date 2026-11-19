import { apiClient } from './api-client';

export type CoinTransactionType =
  | 'WELCOME_BONUS'
  | 'BOOST_SPENT'
  | 'PURCHASE'
  | 'REFUND';

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: CoinTransactionType | string;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  data: {
    coinsBalance: number;
  };
}

export interface WalletTransactionsResponse {
  success: boolean;
  data: CoinTransaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
  };
}

export const walletService = {
  getBalance: async (): Promise<{ coinsBalance: number }> => {
    const res = await apiClient.get<WalletBalanceResponse>('/wallet/balance');
    return res.data;
  },

  getTransactions: async (
    page = 1,
    limit = 20
  ): Promise<{ data: CoinTransaction[]; meta: WalletTransactionsResponse['meta'] }> => {
    const res = await apiClient.get<WalletTransactionsResponse>(
      `/wallet/transactions?page=${page}&limit=${limit}`
    );
    return { data: res.data, meta: res.meta };
  },
};
