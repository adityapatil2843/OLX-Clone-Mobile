import { z } from 'zod';

/**
 * Schema for mobile client runtime environment variables.
 * Note: Only EXPO_PUBLIC_* variables are available at runtime in Expo.
 */
const envSchema = z.object({
  API_BASE_URL: z.string().url().default('http://localhost:5000/api/v1'),
  SOCKET_URL: z.string().url().default('http://localhost:5000'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('OLX Clone Mobile'),
  DEFAULT_LOCALE: z.enum(['en', 'hi', 'mr']).default('en'),
});

const rawEnv = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL,
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME,
  DEFAULT_LOCALE: process.env.EXPO_PUBLIC_DEFAULT_LOCALE,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.warn(
    '[ENV CONFIG WARNING] Missing or invalid environment variables. Using safe development defaults:',
    parsed.error.format()
  );
}

export const env = parsed.success
  ? parsed.data
  : {
      API_BASE_URL: 'http://localhost:5000/api/v1',
      SOCKET_URL: 'http://localhost:5000',
      APP_ENV: 'development' as const,
      APP_NAME: 'OLX Clone Mobile',
      DEFAULT_LOCALE: 'en' as const,
    };

export type AppEnv = typeof env;
