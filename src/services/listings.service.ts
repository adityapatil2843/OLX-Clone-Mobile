import { apiClient } from './api-client';

export interface ListingMediaItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  storageKey: string;
  thumbnailKey?: string | null;
  provider: string;
  displayOrder: number;
  url?: string;
}

export interface ListingOwner {
  id: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
  isVerifiedSeller?: boolean;
}

export interface ListingCategoryInfo {
  id: string;
  name: string;
  slug: string;
}

export interface Listing {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  locationCity?: string | null;
  locationState?: string | null;
  locationLocality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactPhone: string;
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'ARCHIVED';
  attributes?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  categoryId: string;
  owner?: ListingOwner;
  category?: ListingCategoryInfo;
  media?: ListingMediaItem[];
  reels?: Array<{
    id: string;
    caption?: string | null;
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
  }>;
  isWishlisted?: boolean;
}

export interface ListListingsQuery {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface ListingsApiResponse {
  success: boolean;
  data: Listing[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
  };
}

export interface CreateListingPayload {
  title: string;
  description?: string;
  price: number;
  categoryId: string;
  contactPhone: string;
  locationCity?: string;
  locationState?: string;
  locationLocality?: string;
  attributes?: Record<string, unknown>;
}

export const listingsService = {
  getListings: async (query?: ListListingsQuery): Promise<{ data: Listing[]; meta: ListingsApiResponse['meta'] }> => {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.categoryId) params.append('categoryId', query.categoryId);
    if (query?.minPrice !== undefined) params.append('minPrice', String(query.minPrice));
    if (query?.maxPrice !== undefined) params.append('maxPrice', String(query.maxPrice));
    if (query?.city) params.append('city', query.city);
    if (query?.state) params.append('state', query.state);
    if (query?.sort) params.append('sort', query.sort);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString();
    const url = `/listings${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient.get<ListingsApiResponse>(url);
    return { data: res.data, meta: res.meta };
  },

  getListingById: async (id: string): Promise<Listing> => {
    const res = await apiClient.get<{ success: boolean; data: Listing }>(`/listings/${id}`);
    return res.data;
  },

  getMyListings: async (query?: { status?: string; page?: number; limit?: number }): Promise<{ data: Listing[]; meta: ListingsApiResponse['meta'] }> => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString();
    const res = await apiClient.get<ListingsApiResponse>(`/listings/mine${queryString ? `?${queryString}` : ''}`);
    return { data: res.data, meta: res.meta };
  },

  createListing: async (payload: CreateListingPayload): Promise<Listing> => {
    const res = await apiClient.post<{ success: boolean; data: Listing }>('/listings', payload);
    return res.data;
  },

  updateListing: async (id: string, payload: Partial<CreateListingPayload>): Promise<Listing> => {
    const res = await apiClient.patch<{ success: boolean; data: Listing }>(`/listings/${id}`, payload);
    return res.data;
  },

  deleteListing: async (id: string): Promise<void> => {
    await apiClient.delete(`/listings/${id}`);
  },

  deleteMedia: async (listingId: string, mediaId: string): Promise<void> => {
    await apiClient.delete(`/listings/${listingId}/media/${mediaId}`);
  },
};
