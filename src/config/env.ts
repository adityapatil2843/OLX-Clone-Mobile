import { z } from 'zod';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * Resolves the appropriate development host for the current runtime platform:
 * - Web: 'localhost'
 * - Android Emulator: '10.0.2.2'
 * - iOS Simulator: 'localhost'
 * - Physical Device (Android/iOS): Dynamically extracts the host IP of the machine
 *   running the Expo Metro bundler (e.g. from Constants.expoConfig?.hostUri),
 *   or falls back to EXPO_PUBLIC_HOST_IP / '10.0.2.2'.
 */
export function resolveDevHost(fallbackIp?: string): string {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  // 1. Explicit developer override via environment variable
  const explicitHost = process.env.EXPO_PUBLIC_HOST_IP;
  if (explicitHost) {
    return explicitHost;
  }

  const isPhysicalDevice = Device.isDevice;

  // 2. Emulators / Simulators
  if (!isPhysicalDevice) {
    if (Platform.OS === 'android') {
      return '10.0.2.2';
    }
    if (Platform.OS === 'ios') {
      return 'localhost';
    }
  }

  // 3. Physical Devices: Extract host machine's IP from Metro bundler URI
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } })?.extra?.expoGo?.debuggerHost ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (hostUri) {
    const metroIp = hostUri.split(':')[0];
    if (metroIp && metroIp !== 'localhost' && metroIp !== '127.0.0.1') {
      return metroIp;
    }
  }

  // 4. Fallback if undetected
  return fallbackIp || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
}

/**
 * Normalizes a URL so that 'localhost' / '127.0.0.1' are dynamically replaced
 * with the appropriate platform-specific host in development.
 * If the URL already specifies a non-local IP or external domain, it is left untouched.
 */
export function resolveNetworkUrl(url: string): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = resolveDevHost();
      return parsed.toString().replace(/\/$/, '');
    }
    return url;
  } catch {
    // If not a full URL or relative
    return url;
  }
}

/**
 * Schema for mobile client runtime environment variables.
 * Note: Only EXPO_PUBLIC_* variables are available at runtime in Expo.
 */
const envSchema = z.object({
  API_BASE_URL: z.string().url().default('http://localhost:8000/api/v1'),
  SOCKET_URL: z.string().url().default('http://localhost:8000'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('OLX Clone Mobile'),
  DEFAULT_LOCALE: z.enum(['en', 'hi', 'mr']).default('en'),
});

const defaultApiBaseUrl = resolveNetworkUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
);
const defaultSocketUrl = resolveNetworkUrl(
  process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:8000'
);

const rawEnv = {
  API_BASE_URL: defaultApiBaseUrl,
  SOCKET_URL: defaultSocketUrl,
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
      API_BASE_URL: defaultApiBaseUrl,
      SOCKET_URL: defaultSocketUrl,
      APP_ENV: 'development' as const,
      APP_NAME: 'OLX Clone Mobile',
      DEFAULT_LOCALE: 'en' as const,
    };

export type AppEnv = typeof env;
