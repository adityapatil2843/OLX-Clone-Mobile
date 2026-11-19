export class ApiError extends Error {
  public statusCode?: number;
  public code?: string;
  public details?: unknown;
  public retryAfter?: number | string;
  public isRateLimited?: boolean;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    details?: unknown,
    retryAfter?: number | string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
    this.isRateLimited = statusCode === 429;
  }
}
