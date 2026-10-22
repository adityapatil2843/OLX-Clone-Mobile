export type UserRole = 'consumer' | 'business' | 'dealer' | 'admin' | 'USER' | 'ADMIN';

export interface UserProfile {
  id: string;
  phone?: string | null;
  email?: string | null;
  name?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  isVerified?: boolean;
  isVerifiedSeller?: boolean;
  businessName?: string;
  businessDescription?: string;
  city?: string | null;
  state?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  user: UserProfile;
}
