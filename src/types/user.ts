export type UserRole = 'consumer' | 'business' | 'dealer' | 'admin';

export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified: boolean;
  businessName?: string;
  businessDescription?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
}
