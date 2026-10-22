import { useQuery, useMutation } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlist.service';
import { queryClient } from '../providers/QueryProvider';
import { LISTING_QUERY_KEYS } from './useListings';

export const WISHLIST_QUERY_KEYS = {
  all: ['wishlist'] as const,
  list: (page?: number, limit?: number) => [...WISHLIST_QUERY_KEYS.all, 'list', page, limit] as const,
};

export const useWishlistQuery = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: WISHLIST_QUERY_KEYS.list(page, limit),
    queryFn: () => wishlistService.getWishlist(page, limit),
  });
};

export const useToggleWishlistMutation = () => {
  return useMutation({
    mutationFn: async ({ listingId, isWishlisted }: { listingId: string; isWishlisted: boolean }) => {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(listingId);
      } else {
        await wishlistService.addToWishlist(listingId);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.detail(variables.listingId) });
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.all });
    },
  });
};
