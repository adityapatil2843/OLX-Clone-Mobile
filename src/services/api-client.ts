import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { tokenStorage } from './token-storage';

export class ApiError extends Error {
  public statusCode?: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, statusCode?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

interface QueuedPromise {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: QueuedPromise[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: env.API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
    logger.info(`[API Client Initialized] BaseURL: ${env.API_BASE_URL}`);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((sub) => sub.resolve(token));
    this.refreshSubscribers = [];
  }

  private onRefreshError(error: unknown) {
    this.refreshSubscribers.forEach((sub) => sub.reject(error));
    this.refreshSubscribers = [];
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const fullRequestUrl = config.url?.startsWith('http')
          ? config.url
          : `${(config.baseURL || '').replace(/\/$/, '')}/${(config.url || '').replace(/^\//, '')}`;
        logger.debug(`API Request: [${config.method?.toUpperCase()}] ${fullRequestUrl}`);

        const token = await tokenStorage.getAccessToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        logger.error('API Request Configuration Error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug(`API Response: [${response.status}] ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const statusCode = error.response?.status;
        const responseData = error.response?.data as Record<string, unknown> | undefined;

        // Extract normalized error message and code from backend envelope
        const errObj = responseData?.error as Record<string, unknown> | undefined;
        const message =
          (errObj?.message as string) ||
          (responseData?.message as string) ||
          error.message ||
          'An unexpected network error occurred';
        const code = (errObj?.code as string) || (responseData?.code as string) || error.code || 'UNKNOWN_ERROR';
        const details = errObj?.details ?? responseData?.details;

        // Auto refresh token on 401 Unauthorized if not already retried and not an auth route
        const isAuthUrl =
          originalRequest?.url?.includes('/auth/login') ||
          originalRequest?.url?.includes('/auth/refresh') ||
          originalRequest?.url?.includes('/auth/register');

        if (statusCode === 401 && originalRequest && !originalRequest._retry && !isAuthUrl) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push({
                resolve: (newToken: string) => {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  resolve(this.client(originalRequest));
                },
                reject: (err: unknown) => {
                  reject(err);
                },
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await tokenStorage.getRefreshToken();
            if (!refreshToken) {
              throw new ApiError('No refresh token available', 401);
            }

            // Directly call refresh endpoint to avoid interceptor recursion
            const refreshRes = await axios.post(`${env.API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const refreshedData = refreshRes.data?.data;
            const newAccessToken = refreshedData?.accessToken;
            const newRefreshToken = refreshedData?.refreshToken || refreshToken;

            if (!newAccessToken) {
              throw new ApiError('Failed to refresh authentication token', 401);
            }

            await tokenStorage.saveTokens(newAccessToken, newRefreshToken);
            this.onTokenRefreshed(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshErr) {
            this.onRefreshError(refreshErr);
            await tokenStorage.clearTokens();
            return Promise.reject(new ApiError(message, statusCode, code, details));
          } finally {
            this.isRefreshing = false;
          }
        }

        const method = error.config?.method?.toUpperCase() || 'GET';
        const baseURL = error.config?.baseURL || '';
        const requestUrl = error.config?.url || '';
        const fullUrl = requestUrl.startsWith('http')
          ? requestUrl
          : `${baseURL.replace(/\/$/, '')}/${requestUrl.replace(/^\//, '')}`;

        logger.error(
          `API Error: [${statusCode || error.code || 'NETWORK'}] [${method}] ${fullUrl}: ${message}`,
          {
            code: error.code,
            message: error.message,
            statusCode,
            fullUrl,
            baseURL,
            relativeUrl: requestUrl,
            method,
            responseData,
            isAxiosError: error.isAxiosError,
          }
        );
        return Promise.reject(new ApiError(message, statusCode, code, details));
      }
    );
  }

  public getRawClient(): AxiosInstance {
    return this.client;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
