export interface ReelItem {
  id: string;
  videoUrl: string;
  hlsUrl?: string;
  thumbnailUrl: string;
  customThumbnailUrl?: string;
  status?: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | string;
  processingError?: string;
  title: string;
  description?: string;
  price?: number;
  listingId?: string;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  metrics: {
    likes: number;
    views: number;
    shares: number;
  };
  durationSeconds: number;
  createdAt: string;
}
