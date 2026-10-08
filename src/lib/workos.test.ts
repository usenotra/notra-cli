import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { exchangeAuthorizationCode, getAuthorizationUrl, getOAuthIssuer, refreshWithRefreshToken } from './workos';
import { OAuthConnectionError } from './oauth-errors';
import { readCliProcess } from '../utils/cli-test';

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

  test('wraps OAuth connection failures', async () => {
    fetchMock = spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    await expect(refreshWithRefreshToken('client', 'refresh')).rejects.toBeInstanceOf(OAuthConnectionError);
  });

  test('parallel refresh rotates only once and preserves the saved workspace', async () => {
    const home = await mkdtemp(join(tmpdir(), 'notra-refresh-'));
    let refreshes = 0;
    const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch() {
      if (++refreshes > 1) return Response.json({ error: 'invalid_grant' }, { status: 400 });
      await sleep(200);
      const payload = Buffer.from(JSON.stringify({ org_id: 'workos_org' })).toString('base64url');
      return Response.json({
        access_token: `header.${payload}.signature`, refresh_token: 'new-refresh',
        expires_in: 3600, organization_id: 'workos_org',
      });
    } });
    const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: home, NOTRA_API_KEY: undefined };
    const run = (args: string[]) => {
      const child = Bun.spawn(['bun', ...args], {
        cwd: join(import.meta.dir, '../..'), env, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
      });
      child.stdin.end();
      return readCliProcess(child);
    };
    try {
      const config = await run(['src/run.ts', 'config', 'path', '--json']);
      expect(config.code, config.stderr).toBe(0);
      const path = JSON.parse(config.stdout).path;
      await writeFile(path, JSON.stringify({
        accessToken: 'old-access', refreshToken: 'old-refresh', accessTokenExpiresAt: 0,
        organizationId: 'workspace_test',
        authClientId: 'client_test', authIssuer: server.url.origin,
      }));
      const args = ['--eval', 'import { ensureFreshAccessToken } from "./src/lib/workos.ts"; await ensureFreshAccessToken();'];
      const results = await Promise.all([run(args), run(args)]);
      expect(results.map(result => result.code)).toEqual([0, 0]);
      expect(refreshes).toBe(1);
      expect(JSON.parse(await readFile(path, 'utf8'))).toMatchObject({
        refreshToken: 'new-refresh', organizationId: 'workspace_test',
      });
    } finally {
      server.stop(true);
      await rm(home, { recursive: true, force: true });
    }
  });
});
