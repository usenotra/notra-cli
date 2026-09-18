import { describe, expect, test } from 'bun:test';
import { ApiError } from '../lib/http-client';
import { toFriendlyError } from './errors';

describe('friendly errors', () => {
  test('keeps rate-limit retry guidance', () => {
    expect(toFriendlyError(new ApiError('Slow down', 429, 'RATE_LIMITED', '15'))).toMatchObject({
      detail: 'HTTP 429 (RATE_LIMITED); retry after 15',
    });
  });
});
