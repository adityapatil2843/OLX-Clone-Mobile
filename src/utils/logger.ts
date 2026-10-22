/**
 * Safe logger for client-side logging.
 * Automatically masks sensitive keys such as passwords, OTPs, tokens, and authorization headers.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'otp',
  'pin',
  'authorization',
  'secret',
  'apiKey',
  'creditCard',
  'cardNumber',
];

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[MaxDepthReached]';
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (value instanceof Error) {
    const errorRecord: Record<string, unknown> = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    for (const key of Object.getOwnPropertyNames(value)) {
      if (!(key in errorRecord)) {
        errorRecord[key] = (value as unknown as Record<string, unknown>)[key];
      }
    }
    return sanitizeValue(errorRecord, depth);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeValue(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message: string, context?: unknown) => {
    if (__DEV__) {
      console.log(`[INFO] ${message}`, context ? sanitizeValue(context) : '');
    }
  },
  warn: (message: string, context?: unknown) => {
    console.warn(`[WARN] ${message}`, context ? sanitizeValue(context) : '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error ? sanitizeValue(error) : '');
  },
  debug: (message: string, context?: unknown) => {
    if (__DEV__) {
      console.debug(`[DEBUG] ${message}`, context ? sanitizeValue(context) : '');
    }
  },
  sanitize: sanitizeValue,
};
