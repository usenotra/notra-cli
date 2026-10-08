import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readCliProcess } from '../utils/cli-test';
import { createOAuthTestToken, readOAuthLoginProcess } from '../utils/oauth-test';
import type { ConfigSchema } from '../types/config';
import type { OAuthTestClientMetadata, OAuthTestRequest } from '../types/oauth-test';

describe('Connect browser login end to end', () => {
  const root = join(import.meta.dir, '../..');
  let directory: string;
  let server: ReturnType<typeof Bun.serve>;
  const clients = new Map<string, string>();
  const codes = new Map<string, URL>();
  const accessTokens = new Set<string>();
  const requests: OAuthTestRequest[] = [];
  let version = 0;
  let registrationError = false;
  let tokenError = '';
  let omitRefreshToken = false;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'notra-oauth-test-'));
    const build = await readCliProcess(Bun.spawn(['bun', 'run', 'build'], { cwd: root, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' }));
    expect(build.code, build.stderr).toBe(0);
    server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
      const url = new URL(request.url);
      const form = new URLSearchParams(request.method === 'POST' && url.pathname !== '/oauth2/register' ? await request.text() : '');
      const body: unknown = url.pathname === '/oauth2/register' ? await request.json() : undefined;
      requests.push({ path: url.pathname, form: Object.fromEntries(form), body, authorization: request.headers.get('authorization') });
      if (url.pathname === '/oauth2/register') {
        if (registrationError) return Response.json({ error: 'registration_not_supported' }, { status: 400 });
        const metadata = body as OAuthTestClientMetadata;
        expect(metadata.token_endpoint_auth_method).toBe('none');
        expect(metadata.grant_types).toEqual(['authorization_code', 'refresh_token']);
        expect(metadata.redirect_uris).toHaveLength(1);
        const clientId = `client_test_${clients.size + 1}`;
        clients.set(clientId, metadata.redirect_uris[0]!);
        return Response.json({ client_id: clientId, token_endpoint_auth_method: 'none' }, { status: 201 });
      }
      if (url.pathname === '/oauth2/authorize') {
        const redirectUri = clients.get(url.searchParams.get('client_id')!);
        if (redirectUri !== url.searchParams.get('redirect_uri')) return Response.json({ error: 'invalid_redirect_uri' }, { status: 400 });
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('scope')).toBe('openid offline_access');
        expect(url.searchParams.get('resource')).toBe('https://api.usenotra.com');
        expect(url.searchParams.get('nonce')).toBeTruthy();
        const code = `code_${codes.size + 1}`;
        codes.set(code, url);
        const callback = new URL(redirectUri!);
        callback.searchParams.set('state', url.searchParams.get('state')!);
        callback.searchParams.set('code', code);
        return Response.redirect(callback.href, 302);
      }
      if (url.pathname === '/oauth2/token') {
        if (tokenError) return Response.json({ error: tokenError }, { status: 400 });
        expect(form.has('client_secret')).toBe(false);
        expect(form.get('resource')).toBe('https://api.usenotra.com');
        if (form.get('grant_type') === 'authorization_code') {
          const authorization = codes.get(form.get('code')!);
          expect(authorization).toBeDefined();
          expect(form.get('client_id')).toBe(authorization!.searchParams.get('client_id'));
          expect(form.get('redirect_uri')).toBe(authorization!.searchParams.get('redirect_uri'));
          expect(createHash('sha256').update(form.get('code_verifier')!).digest('base64url')).toBe(authorization!.searchParams.get('code_challenge')!);
          codes.delete(form.get('code')!);
        } else {
          expect(form.get('grant_type')).toBe('refresh_token');
          expect(form.get('refresh_token')).toMatch(/^refresh_/);
          expect(clients.has(form.get('client_id')!)).toBe(true);
        }
        const accessToken = createOAuthTestToken(server.url.origin, ++version);
        accessTokens.add(accessToken);
        return Response.json({ access_token: accessToken, token_type: 'bearer', expires_in: 3600, ...(omitRefreshToken ? {} : { refresh_token: `refresh_${version}` }) });
      }
      if (url.pathname === '/v1/me/workspaces') {
        if (!accessTokens.has(request.headers.get('authorization')?.replace('Bearer ', '') ?? '')) return Response.json({ error: 'unauthorized' }, { status: 401 });
        return Response.json({ workspace: 'workspace_test' });
      }
      return Response.json({ error: 'Unexpected test endpoint' }, { status: 404 });
    } });
  });
  afterEach(() => { registrationError = false; tokenError = ''; omitRefreshToken = false; });
  afterAll(async () => { server?.stop(true); if (directory) await rm(directory, { recursive: true, force: true }); });

  function spawn(args: string[], home: string, built: boolean | string, overrides: Record<string, string | undefined> = {}) {
    const entrypoint = typeof built === 'string' ? built : built ? 'dist/run.js' : 'src/run.ts';
    const child = Bun.spawn([built ? 'node' : 'bun', entrypoint, ...args, '--json'], {
      cwd: root, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: home, NOTRA_API_KEY: undefined, NOTRA_WORKOS_CLIENT_ID: undefined, NOTRA_OAUTH_ISSUER: server.url.origin, NOTRA_BASE_URL: server.url.origin, ...overrides },
    });
    child.stdin.end();
    return child;
  }

  async function config(home: string, built: boolean | string) {
    const result = await readCliProcess(spawn(['config', 'path'], home, built));
    const path = JSON.parse(result.stdout).path as string;
    return { path, data: JSON.parse(await readFile(path, 'utf8')) as ConfigSchema };
  }

  async function login(home: string, built: boolean | string, deny = false) {
    const child = spawn(['auth', 'login', '--no-browser'], home, built);
    const loginProcess = readOAuthLoginProcess(child);
    try {
      const url = new URL(await loginProcess.authorizationUrl);
      const callback = new URL(url.searchParams.get('redirect_uri')!);
      expect(callback.hostname).toBe('127.0.0.1');
      const invalid = new URL(callback);
      invalid.search = new URLSearchParams({ state: 'wrong-state', code: 'untrusted' }).toString();
      expect((await fetch(invalid)).status).toBe(400);
      if (deny) {
        callback.search = new URLSearchParams({ state: url.searchParams.get('state')!, error: 'access_denied' }).toString();
        expect((await fetch(callback)).status).toBe(400);
      } else expect((await fetch(url)).status).toBe(200);
      return await loginProcess.result;
    } finally { child.kill(); }
  }

  for (const built of [false, true, ...(process.env.NOTRA_TEST_PACKAGE_ENTRY ? [process.env.NOTRA_TEST_PACKAGE_ENTRY] : [])]) {
    const label = typeof built === 'string' ? 'installed/node' : built ? 'built/node' : 'source/bun';
    test(`${label}: registration, PKCE, API, bound refresh, caching and logout`, async () => {
      const home = await mkdtemp(join(directory, 'session-'));
      const initial = await login(home, built);
      expect(initial.code, initial.stdout + initial.stderr).toBe(0);
      const events = initial.stdout.trim().split('\n').map(line => JSON.parse(line));
      expect(events[1]).toEqual({ status: 'ready', organizationId: 'workspace_test' });
      const saved = await config(home, built);
      expect((await stat(saved.path)).mode & 0o777).toBe(0o600);
      expect(saved.data.authClientId).toBe(saved.data.oauthClientId);
      expect(saved.data.authIssuer).toBe(server.url.origin);
      expect(initial.stdout).not.toContain(saved.data.refreshToken!);
      expect(initial.stdout).not.toContain(saved.data.accessToken!);
      const whoami = await readCliProcess(spawn(['whoami'], home, built));
      expect(whoami.code, whoami.stdout).toBe(0);
      expect(JSON.parse(whoami.stdout)).toEqual({ workspace: 'workspace_test' });
      saved.data.accessTokenExpiresAt = 0;
      await writeFile(saved.path, JSON.stringify(saved.data));
      const refreshed = await readCliProcess(spawn(['whoami'], home, built, { NOTRA_WORKOS_CLIENT_ID: 'wrong-client', NOTRA_OAUTH_ISSUER: 'https://wrong-issuer.example.test' }));
      expect(refreshed.code, refreshed.stdout).toBe(0);
      const after = await config(home, built);
      expect(after.data.refreshToken).not.toBe(saved.data.refreshToken);
      expect(after.data.accessTokenExpiresAt!).toBeGreaterThan(Date.now());
      expect(after.data.organizationId).toBe('workspace_test');
      const registrations = requests.filter(request => request.path === '/oauth2/register').length;
      expect((await login(home, built)).code).toBe(0);
      expect(requests.filter(request => request.path === '/oauth2/register')).toHaveLength(registrations);
      const logout = await readCliProcess(spawn(['auth', 'logout'], home, built));
      expect(JSON.parse(logout.stdout)).toEqual({ status: 'cleared' });
      const cleared = await config(home, built);
      expect(cleared.data.accessToken).toBeUndefined();
      expect(cleared.data.refreshToken).toBeUndefined();
      expect(cleared.data.authClientId).toBeUndefined();
      expect(cleared.data.oauthClientId).toBeTruthy();
      expect((await readCliProcess(spawn(['whoami'], home, built))).code).toBe(3);
      expect(JSON.parse((await readCliProcess(spawn(['auth', 'logout'], home, built))).stdout)).toEqual({ status: 'no-op' });
    }, 15000);

    test(`${label}: denied re-login preserves the existing session`, async () => {
      const home = await mkdtemp(join(directory, 'denied-'));
      expect((await login(home, built)).code).toBe(0);
      const before = await config(home, built);
      expect((await login(home, built, true)).code).toBe(3);
      expect((await config(home, built)).data).toEqual(before.data);
    });

    test(`${label}: invalid refresh clears authentication; transient failures retain it`, async () => {
      const home = await mkdtemp(join(directory, 'refresh-'));
      expect((await login(home, built)).code).toBe(0);
      const saved = await config(home, built);
      saved.data.accessTokenExpiresAt = 0;
      await writeFile(saved.path, JSON.stringify(saved.data));
      tokenError = 'temporarily_unavailable';
      expect((await readCliProcess(spawn(['whoami'], home, built))).code).toBe(3);
      expect((await config(home, built)).data.refreshToken).toBe(saved.data.refreshToken);
      tokenError = '';
      omitRefreshToken = true;
      expect((await readCliProcess(spawn(['whoami'], home, built))).code).toBe(0);
      const retained = await config(home, built);
      expect(retained.data.refreshToken).toBe(saved.data.refreshToken);
      retained.data.accessTokenExpiresAt = 0;
      await writeFile(retained.path, JSON.stringify(retained.data));
      tokenError = 'invalid_grant';
      expect((await readCliProcess(spawn(['whoami'], home, built))).code).toBe(3);
      expect((await config(home, built)).data.accessToken).toBeUndefined();
    });

    test(`${label}: registration errors close the listener and explain configuration`, async () => {
      const home = await mkdtemp(join(directory, 'registration-error-'));
      registrationError = true;
      const result = await readCliProcess(spawn(['auth', 'login', '--no-browser'], home, built));
      expect(result.code).toBe(3);
      expect(JSON.parse(result.stdout).error).toContain('public Connect client');
    });

    test(`${label}: API-key overrides skip refresh and legacy sessions require re-login`, async () => {
      const home = await mkdtemp(join(directory, 'legacy-'));
      expect((await login(home, built)).code).toBe(0);
      const saved = await config(home, built);
      saved.data.accessTokenExpiresAt = 0;
      await writeFile(saved.path, JSON.stringify(saved.data));
      const tokenRequests = requests.filter(request => request.path === '/oauth2/token').length;
      await readCliProcess(spawn(['whoami', '--api-key', 'explicit-api-key'], home, built));
      expect(requests.filter(request => request.path === '/oauth2/token')).toHaveLength(tokenRequests);
      expect(requests.at(-1)?.authorization).toBe('Bearer explicit-api-key');
      delete saved.data.authClientId;
      delete saved.data.authIssuer;
      await writeFile(saved.path, JSON.stringify(saved.data));
      const result = await readCliProcess(spawn(['whoami'], home, built));
      expect(result.code).toBe(3);
      expect(JSON.parse(result.stdout).error).toContain('notra auth login');
      expect((await config(home, built)).data.refreshToken).toBeUndefined();
      expect(requests.filter(request => request.path === '/oauth2/token')).toHaveLength(tokenRequests);
    });
  }
});
