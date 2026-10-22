import { useQuery, useMutation } from '@tanstack/react-query';
import {
  listingsService,
  ListListingsQuery,
  CreateListingPayload,
} from '../services/listings.service';
import { queryClient } from '../providers/QueryProvider';

export const LISTING_QUERY_KEYS = {
  all: ['listings'] as const,
  list: (params?: ListListingsQuery) => [...LISTING_QUERY_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...LISTING_QUERY_KEYS.all, 'detail', id] as const,
  mine: (params?: { status?: string; page?: number; limit?: number }) =>
    [...LISTING_QUERY_KEYS.all, 'mine', params] as const,
};

export const useListingsQuery = (params?: ListListingsQuery) => {
  return useQuery({
    queryKey: LISTING_QUERY_KEYS.list(params),
    queryFn: () => listingsService.getListings(params),
  });
};

export const useListingDetailQuery = (id: string) => {
  return useQuery({
    queryKey: LISTING_QUERY_KEYS.detail(id),
    queryFn: () => listingsService.getListingById(id),
    enabled: Boolean(id),
  });
};

export const useMyListingsQuery = (params?: { status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: LISTING_QUERY_KEYS.mine(params),
    queryFn: () => listingsService.getMyListings(params),
  });
};

export const useCreateListingMutation = () => {
  return useMutation({
    mutationFn: (payload: CreateListingPayload) => listingsService.createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.all });
    },
  });
};

export const useUpdateListingMutation = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateListingPayload> }) =>
      listingsService.updateListing(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.all });
    },
  });
};

export const useDeleteListingMutation = () => {
  return useMutation({
    mutationFn: (id: string) => listingsService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTING_QUERY_KEYS.all });
    },
  });
};
