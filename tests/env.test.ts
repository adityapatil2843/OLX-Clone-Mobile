import { env } from '../src/config/env';

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
});
