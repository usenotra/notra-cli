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
  test('turns account-key workspace 403s into selection guidance', () => {
    const required = new ApiError(
      'Organization selection required: send X-Notra-Organization-Id for the workspace this request should act on', 403,
    );
    expect(toFriendlyError(required)).toMatchObject({
      message: 'This API key works in several workspaces. Choose the workspace to act on.', exitCode: 3,
    });
    expect(toFriendlyError(new ApiError('Workspace access revoked', 403)).detail).toContain('notra workspaces use');
    expect(toFriendlyError(new ApiError('workspace access revoked for this key.', 403)).message)
      .toBe('Your credentials no longer have access to the selected workspace.');
    expect(toFriendlyError(new ApiError('Forbidden', 403))).toMatchObject({ message: 'Forbidden', detail: 'HTTP 403' });
  });
});
