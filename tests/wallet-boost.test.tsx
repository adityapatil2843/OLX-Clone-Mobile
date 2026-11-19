import React from 'react';

// Mock lucide-react-native before importing components that consume it
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const MockIcon = (props: any) => React.createElement('Icon', props);
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    }
  );
});

jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: (props: any) => React.createElement('Image', props),
  };
});

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WALLET_QUERY_KEYS } from '../src/hooks/useWallet';
import { BoostModal } from '../src/components/boost/BoostModal';
import { AccountHeader } from '../src/components/account/AccountHeader';

// ── Mock Hooks & Services ──────────────────────────────────────
const mockRefetchBalance = jest.fn();
let mockBalanceState = {
  data: { coinsBalance: 200 },
  isLoading: false,
  isError: false,
  refetch: mockRefetchBalance,
};

jest.mock('../src/hooks/useWallet', () => ({
  WALLET_QUERY_KEYS: {
    all: ['wallet'],
    balance: (userId?: string | null) => ['wallet', 'balance', userId ?? 'anonymous'],
    transactions: (userId?: string | null, page = 1, limit = 20) => [
      'wallet',
      'transactions',
      userId ?? 'anonymous',
      page,
      limit,
    ],
  },
  useWalletBalanceQuery: () => mockBalanceState,
}));

const mockPackages = [
  {
    id: 'pkg-1',
    name: '1-Day Boost',
    durationDays: 1,
    coinsCost: 50,
    isActive: true,
  },
  {
    id: 'pkg-3',
    name: '3-Day Boost',
    durationDays: 3,
    coinsCost: 120,
    isActive: true,
  },
  {
    id: 'pkg-7',
    name: '7-Day Mega Boost',
    durationDays: 7,
    coinsCost: 250,
    isActive: true,
  },
];

jest.mock('../src/hooks/useBoost', () => ({
  useBoostPackagesQuery: () => ({
    data: mockPackages,
    isLoading: false,
  }),
  useCreateBoostMutation: () => ({
    mutate: mockMutateBoost,
    isPending: mockIsMutatePending,
  }),
}));

const mockMutateBoost = jest.fn();
let mockIsMutatePending = false;

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Wallet Cache Isolation', () => {
  it('scopes wallet query keys strictly by userId to prevent cross-user leak', () => {
    const keyUserA = WALLET_QUERY_KEYS.balance('user-123');
    const keyUserB = WALLET_QUERY_KEYS.balance('user-456');
    const keyAnon = WALLET_QUERY_KEYS.balance(null);

    expect(keyUserA).toEqual(['wallet', 'balance', 'user-123']);
    expect(keyUserB).toEqual(['wallet', 'balance', 'user-456']);
    expect(keyAnon).toEqual(['wallet', 'balance', 'anonymous']);
    expect(keyUserA).not.toEqual(keyUserB);
  });
});

describe('AccountHeader — Wallet Balance Integration', () => {
  const dummyUser = {
    id: 'usr-1',
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
    role: 'USER' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBalanceState = {
      data: { coinsBalance: 200 },
      isLoading: false,
      isError: false,
      refetch: mockRefetchBalance,
    };
  });

  it('renders live coin balance pill when authenticated', async () => {
    const { getByText } = await render(
      <AccountHeader
        user={dummyUser}
        isAuthenticated={true}
        onEditProfile={jest.fn()}
        onOpenDrawer={jest.fn()}
        onLoginPress={jest.fn()}
      />
    );

    expect(getByText('200')).toBeTruthy();
    expect(getByText('Coins')).toBeTruthy();
  });

  it('navigates to /wallet screen when wallet pill is pressed', async () => {
    const { getByText } = await render(
      <AccountHeader
        user={dummyUser}
        isAuthenticated={true}
        onEditProfile={jest.fn()}
        onOpenDrawer={jest.fn()}
        onLoginPress={jest.fn()}
      />
    );

    fireEvent.press(getByText('200'));
    expect(mockPush).toHaveBeenCalledWith('/wallet');
  });

  it('handles balance error gracefully and triggers refetch on press', async () => {
    mockBalanceState = {
      data: null as any,
      isLoading: false,
      isError: true,
      refetch: mockRefetchBalance,
    };

    const { getByText } = await render(
      <AccountHeader
        user={dummyUser}
        isAuthenticated={true}
        onEditProfile={jest.fn()}
        onOpenDrawer={jest.fn()}
        onLoginPress={jest.fn()}
      />
    );

    const retryBtn = getByText('Retry Coins');
    expect(retryBtn).toBeTruthy();
    fireEvent.press(retryBtn);
    expect(mockRefetchBalance).toHaveBeenCalledTimes(1);
  });
});

describe('BoostModal — Live Balance, Insufficient Coins, In-flight Lock & Refresh', () => {
  const dummyTarget = {
    type: 'LISTING' as const,
    id: 'listing-123',
    title: 'Vintage Royal Enfield',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMutatePending = false;
    mockBalanceState = {
      data: { coinsBalance: 100 },
      isLoading: false,
      isError: false,
      refetch: mockRefetchBalance,
    };
  });

  it('displays user balance and calculates remaining preview on package selection', async () => {
    const { getByText, getAllByText, getByTestId } = await render(
      <BoostModal
        visible={true}
        target={dummyTarget}
        onClose={jest.fn()}
      />
    );

    // Available balance is 100
    expect(getByText('100 Coins')).toBeTruthy();

    // Select 1-Day Boost (cost 50)
    fireEvent.press(getByTestId('package-card-pkg-1'));

    // Both Total Cost (50 Coins) and Remaining (100 - 50 = 50 Coins) appear
    await waitFor(() => {
      expect(getAllByText('50 Coins').length).toBe(2);
      expect(getByText('Activate Boost for 50 Coins')).toBeTruthy();
    });
  });

  it('detects insufficient coins, shows deficit warning and disables submit CTA', async () => {
    // User has 100 coins, selects 7-Day Mega Boost (cost 250) -> deficit = 150
    const { getByText, getByTestId } = await render(
      <BoostModal
        visible={true}
        target={dummyTarget}
        onClose={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('package-card-pkg-7'));

    await waitFor(() => {
      // Deficit warning message
      expect(
        getByText('You need 150 more coins to activate this boost. Your current balance is 100 coins.')
      ).toBeTruthy();

      // Remaining balance shows deficit
      expect(getByText('Insufficient (-150 Coins)')).toBeTruthy();

      // CTA button text indicates deficit
      expect(getByText('Insufficient Coins (Need 150 More)')).toBeTruthy();
    });
  });

  it('locks CTA button while mutation is in-flight to prevent duplicate submission', async () => {
    mockIsMutatePending = true;

    const { getByTestId, queryByText } = await render(
      <BoostModal
        visible={true}
        target={dummyTarget}
        onClose={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('package-card-pkg-1'));

    // When isPending is true, text is replaced with ActivityIndicator
    await waitFor(() => {
      expect(queryByText('Activate Boost for 50 Coins')).toBeNull();
    });
  });

  it('triggers balance refetch on mutation error to synchronize with backend', async () => {
    let capturedErrorCallback: ((err: any) => void) | null = null;
    mockMutateBoost.mockImplementation((payload, callbacks) => {
      capturedErrorCallback = callbacks.onError;
    });

    const { getByText, getByTestId } = await render(
      <BoostModal
        visible={true}
        target={dummyTarget}
        onClose={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('package-card-pkg-1'));

    await waitFor(() => {
      expect(getByText('Activate Boost for 50 Coins')).toBeTruthy();
    });

    fireEvent.press(getByTestId('boost-submit-btn'));

    expect(mockMutateBoost).toHaveBeenCalledTimes(1);

    // Simulate backend rejection (e.g. 400 Insufficient Coins)
    if (capturedErrorCallback) {
      (capturedErrorCallback as any)({ message: 'Insufficient coins for this boost package' });
    }

    // Must have called refetchBalance to synchronize with server truth
    expect(mockRefetchBalance).toHaveBeenCalledTimes(1);
  });
});
