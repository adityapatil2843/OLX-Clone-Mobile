import { env, resolveDevHost, resolveNetworkUrl } from '../src/config/env';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

describe('Environment Configuration Foundation', () => {
  it('loads valid default environment properties', () => {
    expect(env).toBeDefined();
    expect(typeof env.API_BASE_URL).toBe('string');
    expect(env.API_BASE_URL).toMatch(/^https?:\/\//);
    expect(typeof env.SOCKET_URL).toBe('string');
    expect(env.SOCKET_URL).toMatch(/^https?:\/\//);
    expect(['development', 'staging', 'production']).toContain(env.APP_ENV);
    expect(['en', 'hi', 'mr']).toContain(env.DEFAULT_LOCALE);
  });

  it('does not contain production secrets or keys', () => {
    const serialized = JSON.stringify(env);
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('privateKey');
  });

  describe('Dynamic Host and URL Resolution', () => {
    const originalPlatform = Platform.OS;
    const originalDevice = Device.isDevice;
    const originalHostIp = process.env.EXPO_PUBLIC_HOST_IP;

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
      Object.defineProperty(Device, 'isDevice', { value: originalDevice, configurable: true });
      process.env.EXPO_PUBLIC_HOST_IP = originalHostIp;
    });

    it('resolves to localhost on Web', () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      expect(resolveDevHost()).toBe('localhost');
      expect(resolveNetworkUrl('http://localhost:8000/api/v1')).toBe('http://localhost:8000/api/v1');
    });

    it('resolves to 10.0.2.2 on Android Emulator', () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
      Object.defineProperty(Device, 'isDevice', { value: false, configurable: true });
      delete process.env.EXPO_PUBLIC_HOST_IP;
      expect(resolveDevHost()).toBe('10.0.2.2');
      expect(resolveNetworkUrl('http://localhost:8000/api/v1')).toBe('http://10.0.2.2:8000/api/v1');
    });

    it('resolves to EXPO_PUBLIC_HOST_IP when explicitly set', () => {
      Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
      Object.defineProperty(Device, 'isDevice', { value: true, configurable: true });
      process.env.EXPO_PUBLIC_HOST_IP = '192.168.1.150';
      expect(resolveDevHost()).toBe('192.168.1.150');
      expect(resolveNetworkUrl('http://localhost:8000/api/v1')).toBe('http://192.168.1.150:8000/api/v1');
    });

    it('leaves external domain URLs unchanged', () => {
      expect(resolveNetworkUrl('https://api.production.com/api/v1')).toBe('https://api.production.com/api/v1');
    });
  });
});

