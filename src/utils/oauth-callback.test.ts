import { describe, expect, test } from 'bun:test';
import { startOAuthCallback } from './oauth-callback';

describe('OAuth loopback callback', () => {
  test('rejects invalid and duplicated state, then accepts the legitimate callback', async () => {
    const callback = await startOAuthCallback('expected-state');
    try {
      for (const query of ['code=secret', 'code=secret&state=wrong', 'code=secret&state=expected-state&state=wrong']) {
        expect((await fetch(`${callback.redirectUri}?${query}`)).status).toBe(400);
      }
      expect((await fetch(callback.redirectUri, { method: 'POST' })).status).toBe(404);
      const response = await fetch(`${callback.redirectUri}?state=expected-state&code=code-1`);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.text()).not.toContain('code-1');
      expect(await callback.code).toBe('code-1');
      expect((await fetch(`${callback.redirectUri}?state=expected-state&code=code-2`)).status).toBe(400);
    } finally { callback.close(); }
  });

  test('denial propagates only with the expected state', async () => {
    const callback = await startOAuthCallback('expected-state');
    try {
      expect((await fetch(`${callback.redirectUri}?state=wrong&error=access_denied`)).status).toBe(400);
      expect((await fetch(`${callback.redirectUri}?state=expected-state&error=access_denied`)).status).toBe(400);
      await expect(callback.code).rejects.toMatchObject({ code: 'access_denied' });
    } finally { callback.close(); }
  });

  test('times out while waiting for authorization', async () => {
    const callback = await startOAuthCallback('expected-state', undefined, 20);
    try {
      await expect(callback.code).rejects.toMatchObject({ code: 'authorization_timeout' });
    } finally { callback.close(); }
  });
});
