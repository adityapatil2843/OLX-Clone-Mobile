import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

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

class ApiClient {
  private client: AxiosInstance;

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
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: [${config.method?.toUpperCase()}] ${config.url}`, {
          params: config.params,
        });
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
      (error: AxiosError) => {
        const statusCode = error.response?.status;
        const responseData = error.response?.data as Record<string, unknown> | undefined;

        const message =
          (responseData?.message as string) ||
          error.message ||
          'An unexpected network error occurred';
        const code = (responseData?.code as string) || error.code || 'UNKNOWN_ERROR';

        logger.error(`API Error: [${statusCode || 'NETWORK'}] ${error.config?.url}: ${message}`);

        return Promise.reject(new ApiError(message, statusCode, code, responseData?.details));
      }
    );
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

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
