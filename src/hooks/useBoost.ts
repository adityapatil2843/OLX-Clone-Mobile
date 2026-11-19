import { useQuery, useMutation } from '@tanstack/react-query';
import { boostService, CreateBoostPayload } from '../services/boost.service';
import { queryClient } from '../providers/QueryProvider';
import { WALLET_QUERY_KEYS } from './useWallet';

export const BOOST_QUERY_KEYS = {
  all: ['boost'] as const,
  packages: () => [...BOOST_QUERY_KEYS.all, 'packages'] as const,
  mine: (page?: number, limit?: number) =>
    [...BOOST_QUERY_KEYS.all, 'mine', page, limit] as const,
};

export const useBoostPackagesQuery = () => {
  return useQuery({
    queryKey: BOOST_QUERY_KEYS.packages(),
    queryFn: () => boostService.getPackages(),
  });
};

export const useMyAdvertisementsQuery = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: BOOST_QUERY_KEYS.mine(page, limit),
    queryFn: () => boostService.getMyAdvertisements(page, limit),
  });
};

export const useCreateBoostMutation = () => {
  return useMutation({
    mutationFn: (payload: CreateBoostPayload) => boostService.createBoost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.all });
    },
  });
};

export const useCancelBoostMutation = () => {
  return useMutation({
    mutationFn: (id: string) => boostService.cancelBoost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOST_QUERY_KEYS.all });
    },
  });
};
