import { apiClient } from './api-client';
import { Listing } from './listings.service';

export interface WishlistItem {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
  listing: Listing;
}

export interface WishlistApiResponse {
  success: boolean;
  data: WishlistItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const wishlistService = {
  getWishlist: async (page = 1, limit = 20): Promise<{ data: WishlistItem[]; meta: WishlistApiResponse['meta'] }> => {
    const res = await apiClient.get<WishlistApiResponse>(`/wishlist?page=${page}&limit=${limit}`);
    return { data: res.data, meta: res.meta };
  },

  addToWishlist: async (listingId: string): Promise<WishlistItem> => {
    const res = await apiClient.post<{ success: boolean; data: WishlistItem }>(`/wishlist/${listingId}`);
    return res.data;
  },

  removeFromWishlist: async (listingId: string): Promise<void> => {
    await apiClient.delete(`/wishlist/${listingId}`);
  },
};
