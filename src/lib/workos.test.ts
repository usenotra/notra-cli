import { afterEach, describe, expect, test } from 'bun:test';
import {
  MILLISECONDS_PER_SECOND,
  PRODUCTION_WORKOS_CLIENT_ID,
  WORKOS_CLIENT_ID_ENV_VAR,
} from '../constants/auth';
import { deviceAuthorizationResponseSchema } from '../types/workos';
import {
  getAccessTokenExpiry,
  getWorkosClientId,
  nextPollIntervalMs,
  slowedDownIntervalSeconds,
} from './workos';

afterEach(() => {
  delete process.env[WORKOS_CLIENT_ID_ENV_VAR];
});

describe('getWorkosClientId', () => {
  test('defaults to the production client id', () => {
    expect(getWorkosClientId()).toBe(PRODUCTION_WORKOS_CLIENT_ID);
  });

  test('prefers the environment override', () => {
    process.env[WORKOS_CLIENT_ID_ENV_VAR] = 'client_test_override';
    expect(getWorkosClientId()).toBe('client_test_override');
  });
});

describe('getAccessTokenExpiry', () => {
  test('decodes the exp claim from a JWT access token', () => {
    const exp = 1_800_000_000;
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    const token = `eyJhbGciOiJSUzI1NiJ9.${payload}.signature`;
    expect(getAccessTokenExpiry(token)).toBe(exp * MILLISECONDS_PER_SECOND);
  });

  test('returns undefined for opaque tokens', () => {
    expect(getAccessTokenExpiry('not-a-jwt')).toBeUndefined();
    expect(getAccessTokenExpiry('a.%%%.c')).toBeUndefined();
  });
});

describe('polling intervals', () => {
  test('converts the server interval to milliseconds', () => {
    expect(nextPollIntervalMs(5)).toBe(5000);
    expect(nextPollIntervalMs(undefined)).toBe(5000);
  });

  test('slow_down increases the interval by five seconds', () => {
    expect(slowedDownIntervalSeconds(5)).toBe(10);
  });
});

describe('deviceAuthorizationResponseSchema', () => {
  test('parses a WorkOS device authorization response', () => {
    const parsed = deviceAuthorizationResponseSchema.parse({
      device_code: 'device_123',
      user_code: 'ABCD-1234',
      verification_uri: 'https://auth.example.com/device',
      verification_uri_complete: 'https://auth.example.com/device?user_code=ABCD-1234',
      expires_in: 300,
      interval: 5,
    });
    expect(parsed.user_code).toBe('ABCD-1234');
    expect(parsed.interval).toBe(5);
  });
});
