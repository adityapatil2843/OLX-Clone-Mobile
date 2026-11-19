import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { tokenStorage } from './token-storage';
import { refreshCoordinator } from './refresh-coordinator';
import { ApiError } from './api-error';

export { ApiError } from './api-error';

let lastRateLimitAlertTimestamp = 0;
const RATE_LIMIT_ALERT_COOLDOWN_MS = 5000;

function showRateLimitAlert(message?: string) {
  const now = Date.now();
  if (now - lastRateLimitAlertTimestamp > RATE_LIMIT_ALERT_COOLDOWN_MS) {
    lastRateLimitAlertTimestamp = now;
    Alert.alert(
      'Too Many Requests',
      message || 'You are making requests too quickly. Please wait a moment and try again.'
    );
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.API_BASE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
    logger.info(`[API Client Initialized] BaseURL: ${env.API_BASE_URL}`);
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
        const retryAfter = error.response?.headers?.['retry-after'];

        // Handle 429 Too Many Requests (Rate Limiting)
        if (statusCode === 429) {
          const rateLimitMsg =
            (errObj?.message as string) ||
            (responseData?.message as string) ||
            'Too many requests. Please wait a moment and try again.';
          logger.warn(
            `[429 Rate Limited] Request: ${error.config?.url} | Retry-After: ${retryAfter || 'N/A'}`
          );
          showRateLimitAlert(rateLimitMsg);
          return Promise.reject(
            new ApiError(rateLimitMsg, 429, code || 'TOO_MANY_REQUESTS', details, retryAfter)
          );
        }

        // Auto refresh token on 401 Unauthorized if not already retried and not an auth route
        const isAuthUrl =
          originalRequest?.url?.includes('/auth/login') ||
          originalRequest?.url?.includes('/auth/refresh') ||
          originalRequest?.url?.includes('/auth/register') ||
          originalRequest?.url?.includes('/auth/logout');

        if (statusCode === 401 && originalRequest && !originalRequest._retry && !isAuthUrl) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshCoordinator.getFreshAccessToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (_refreshErr) {
            // refreshCoordinator handles tokenStorage and auth store cleanup on failure
            return Promise.reject(new ApiError(message, statusCode, code, details, retryAfter));
          }
        }

        const method = error.config?.method?.toUpperCase() || 'GET';
        const requestUrl = error.config?.url || '';

        // Safe structured logging without logging passwords, tokens, or credential response data
        logger.error(
          `API Error: [${statusCode || error.code || 'NETWORK'}] [${method}] ${requestUrl}: ${message}`,
          {
            route: requestUrl,
            method,
            statusCode,
            errorCode: code,
          }
        );
        return Promise.reject(new ApiError(message, statusCode, code, details, retryAfter));
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

export const refreshAccessToken = async (): Promise<string> => {
  return refreshCoordinator.getFreshAccessToken();
};
