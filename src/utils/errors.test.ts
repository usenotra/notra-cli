import { describe, expect, test } from 'bun:test';
import { ApiError } from '../lib/http-client';
import { toFriendlyError } from './errors';
import { OAuthConnectionError } from '../lib/oauth-errors';

describe('friendly errors', () => {
  test('classifies OAuth connection failures as network errors', () => {
    expect(toFriendlyError(new OAuthConnectionError(new TypeError('fetch failed')))).toEqual({
      message: 'Could not reach the Notra OAuth server.', exitCode: 6,
      detail: 'TypeError: fetch failed',
    });
    const cause = new Error('getaddrinfo ENOTFOUND oauth.usenotra.com');
    expect(toFriendlyError(new OAuthConnectionError(new TypeError('fetch failed', { cause })))).toMatchObject({
      detail: 'Error: getaddrinfo ENOTFOUND oauth.usenotra.com', exitCode: 6,
    });
  });
  test('keeps rate-limit retry guidance', () => {
    expect(toFriendlyError(new ApiError('Slow down', 429, 'RATE_LIMITED', '15'))).toMatchObject({
      detail: 'HTTP 429 (RATE_LIMITED); retry after 15',
    });
  });
});
