import { logger } from '../src/utils/logger';

describe('Safe Logger Sanitization', () => {
  it('masks sensitive tokens, passwords and OTPs', () => {
    const rawData = {
      user: 'alice',
      password: 'superSecretPassword123',
      token: 'jwt.bearer.token',
      otp: '123456',
      normalInfo: 'visible details',
    };

    const sanitized = logger.sanitize(rawData) as Record<string, unknown>;

    expect(sanitized.user).toBe('alice');
    expect(sanitized.normalInfo).toBe('visible details');
    expect(sanitized.password).toBe('***REDACTED***');
    expect(sanitized.token).toBe('***REDACTED***');
    expect(sanitized.otp).toBe('***REDACTED***');
  });

  it('masks nested sensitive objects', () => {
    const nestedData = {
      request: {
        headers: {
          authorization: 'Bearer secret_token',
        },
      },
    };

    const sanitized = logger.sanitize(nestedData) as { request: { headers: { authorization: string } } };
    expect(sanitized.request.headers.authorization).toBe('***REDACTED***');
  });
});
