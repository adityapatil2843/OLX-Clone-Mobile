export type Locale = 'en' | 'hi' | 'mr';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  pincode?: string;
}
