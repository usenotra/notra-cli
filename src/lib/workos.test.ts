import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { authenticationResponseSchema } from '../schemas/workos';
import { exchangeAuthorizationCode, getAccessTokenExpiry, getAuthorizationUrl, getOAuthIssuer, refreshWithRefreshToken } from './workos';
import { OAuthConnectionError } from './oauth-errors';

let fetchMock: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | undefined;
afterEach(() => fetchMock?.mockRestore());

describe('Connect OAuth', () => {
  test('only accepts HTTPS issuers or loopback HTTP test servers', () => {
    expect(getOAuthIssuer('https://oauth.usenotra.com/')).toBe('https://oauth.usenotra.com');
    expect(getOAuthIssuer('http://127.0.0.1:1234')).toBe('http://127.0.0.1:1234');
    for (const issuer of ['http://example.com', 'https://user:secret@example.com', 'https://example.com/path', 'https://example.com/?x=1']) {
      expect(() => getOAuthIssuer(issuer)).toThrow();
    }
  });

  test('builds the same Connect authorization flow used by MCP with PKCE and API audience', () => {
    const url = new URL(getAuthorizationUrl({ clientId: 'client_test', redirectUri: 'http://127.0.0.1:1234/callback', state: 'state', nonce: 'nonce', codeChallenge: 'challenge' }));
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: 'code', scope: 'openid offline_access', resource: 'https://api.usenotra.com',
      code_challenge_method: 'S256', code_challenge: 'challenge', state: 'state', nonce: 'nonce',
    });
    expect(url.href).not.toContain('user_management');
  });

  test('exchanges codes at Connect with a verifier and without a client secret', async () => {
    fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ access_token: 'access', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 }));
    expect(await exchangeAuthorizationCode('client_test', 'code', 'http://127.0.0.1:1234/callback', 'verifier')).toMatchObject({ access_token: 'access', token_type: 'Bearer' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toEndWith('/oauth2/token');
    expect(init?.redirect).toBe('error');
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({
      grant_type: 'authorization_code', client_id: 'client_test', code: 'code',
      redirect_uri: 'http://127.0.0.1:1234/callback', code_verifier: 'verifier', resource: 'https://api.usenotra.com',
    });
  });

  test('refreshes against the session issuer and retains an omitted refresh token', async () => {
    fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ access_token: 'new-access', expires_in: 3600 }));
    expect(await refreshWithRefreshToken('bound-client', 'old-refresh', 'https://session.example.test')).toMatchObject({ refresh_token: 'old-refresh' });
    expect(fetchMock.mock.calls[0]![0]).toBe('https://session.example.test/oauth2/token');
  });

  test('returns OAuth errors without persisting malformed or denied authentication', async () => {
    fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'invalid_grant' }, { status: 400 }));
    await expect(exchangeAuthorizationCode('client', 'code', 'http://127.0.0.1/callback', 'verifier')).rejects.toMatchObject({ code: 'invalid_grant' });
    expect(authenticationResponseSchema.safeParse({ access_token: 'access' }).success).toBe(false);
  });

  test('classifies network errors, timeouts and invalid JSON separately', async () => {
    fetchMock = spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    await expect(refreshWithRefreshToken('client', 'refresh')).rejects.toBeInstanceOf(OAuthConnectionError);
    fetchMock.mockRejectedValue(new DOMException('timeout', 'TimeoutError'));
    await expect(refreshWithRefreshToken('client', 'refresh')).rejects.toMatchObject({ name: 'TimeoutError' });
    fetchMock.mockResolvedValue(new Response('not-json'));
    await expect(refreshWithRefreshToken('client', 'refresh')).rejects.toThrow('invalid JSON');
  });

  test('reads expiration only as a scheduling hint and tolerates malformed tokens', () => {
    expect(getAccessTokenExpiry(`header.${Buffer.from('{"exp":123}').toString('base64url')}.signature`)).toBe(123000);
    for (const token of ['opaque', 'a.b.c', 'a.bnVsbA.c', 'a.W10.c']) expect(getAccessTokenExpiry(token)).toBeUndefined();
  });

});
