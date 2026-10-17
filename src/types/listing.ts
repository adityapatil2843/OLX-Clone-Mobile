export type ListingCategory =
  | 'vehicles'
  | 'electronics'
  | 'properties'
  | 'mobiles'
  | 'jobs'
  | 'services'
  | 'furniture'
  | 'fashion'
  | 'other';

export type ListingStatus = 'active' | 'sold' | 'expired' | 'under_review';

export interface ListingMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  isPrimary?: boolean;
}

export interface ListingItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  media: ListingMedia[];
  location: {
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}
