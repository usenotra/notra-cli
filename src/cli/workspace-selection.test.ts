import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readCliProcess } from '../utils/cli-test';

const SELECTION_REQUIRED =
  'Organization selection required: send X-Notra-Organization-Id for the workspace this request should act on';

const WORKSPACES = [
  { id: 'org_acme', slug: 'acme', name: 'Acme', logo: null, role: 'owner', status: 'active', isCurrent: true },
  { id: 'org_beta', slug: 'beta', name: 'Beta', logo: null, role: 'member', status: 'active', isCurrent: false },
];

describe('workspace selection for account API keys', () => {
  let directory: string;
  let server: ReturnType<typeof Bun.serve>;
  let headers: Array<{ path: string; organizationId: string | null }> = [];
  const root = join(import.meta.dir, '../..');

  beforeAll(async () => {
    server = Bun.serve({
      hostname: '127.0.0.1', port: 0,
      fetch(request) {
        const { pathname } = new URL(request.url);
        const organizationId = request.headers.get('x-notra-organization-id');
        headers.push({ path: pathname, organizationId });
        if (pathname === '/v1/me/workspaces') {
          if (organizationId && !WORKSPACES.some((workspace) => workspace.id === organizationId)) {
            return Response.json({ error: 'Workspace access revoked' }, { status: 403 });
          }
          return Response.json({ currentWorkspace: WORKSPACES[0], workspaces: WORKSPACES, authentication: { type: 'apiKey' } });
        }
        if (!organizationId) return Response.json({ error: SELECTION_REQUIRED }, { status: 403 });
        return Response.json({ skills: [] });
      },
    });
  });

  beforeEach(async () => {
    headers = [];
    if (directory) await rm(directory, { recursive: true, force: true });
    directory = await mkdtemp(join(tmpdir(), 'notra-cli-workspace-test-'));
  });

  afterAll(async () => {
    server?.stop(true);
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  function run(args: string[], env: Record<string, string | undefined> = {}) {
    const child = Bun.spawn(['bun', 'src/run.ts', ...args, '--base-url', server.url.href, '--json'], {
      cwd: root, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
      env: {
        ...process.env, HOME: directory, XDG_CONFIG_HOME: directory,
        NOTRA_API_KEY: 'ntra_account', NOTRA_BASE_URL: undefined, NOTRA_ORGANIZATION_ID: undefined, ...env,
      },
    });
    child.stdin.end();
    return readCliProcess(child);
  }

  test('sends no organization header when none is chosen and explains the 403', async () => {
    const result = await run(['skills', 'list']);
    expect(result.code).toBe(3);
    expect(headers).toEqual([{ path: '/v1/skills', organizationId: null }]);
    const output = JSON.parse(result.stdout);
    expect(output.error).toBe('This API key works in several workspaces. Choose the workspace to act on.');
    expect(output.detail).toContain('notra workspaces use <id|slug>');
    expect(output.detail).toContain('--org <id|slug>');
    expect(output.detail).toContain('NOTRA_ORGANIZATION_ID');
  });

  test('flag beats environment, which beats saved config', async () => {
    const saved = await run(['config', 'set', 'organization-id', 'org_config']);
    expect(saved.code, saved.stdout).toBe(0);

    await run(['skills', 'list']);
    await run(['skills', 'list'], { NOTRA_ORGANIZATION_ID: 'org_env' });
    await run(['skills', 'list', '--org', 'org_flag'], { NOTRA_ORGANIZATION_ID: 'org_env' });
    await run(['skills', 'list', '--organization-id=org_alias'], { NOTRA_ORGANIZATION_ID: 'org_env' });
    await run(['skills', 'list', '--organization-id', 'org_first', '--org', 'org_last']);
    expect(headers.map((entry) => entry.organizationId)).toEqual([
      'org_config', 'org_env', 'org_flag', 'org_alias', 'org_last',
    ]);
  });

  test('global workspace flags before the command still resolve it', async () => {
    const result = await run(['--org', 'acme', 'skills', '--organization-id=beta', 'list']);
    expect(result.code, result.stdout).toBe(0);
    expect(headers).toEqual([{ path: '/v1/skills', organizationId: 'beta' }]);
  });

  test('flag values that look like --org do not pick the workspace', async () => {
    const result = await run(['skills', 'create', '--org', 'acme', '--name', 'natural', '--description', '--org=beta', '--content', 'x']);
    expect(result.code, result.stdout).toBe(0);
    expect(headers).toEqual([{ path: '/v1/skills', organizationId: 'acme' }]);
  });

  test('workspaces list ignores a stale selection so a replacement can be found', async () => {
    const result = await run(['workspaces', 'list', '--org', 'org_gone']);
    expect(result.code, result.stdout).toBe(0);
    expect(JSON.parse(result.stdout).workspaces).toHaveLength(2);
    expect(headers).toEqual([{ path: '/v1/me/workspaces', organizationId: null }]);
  });

  test('passes a workspace slug through unchanged', async () => {
    await run(['skills', 'list', '--org', 'acme']);
    await run(['skills', 'list'], { NOTRA_ORGANIZATION_ID: 'beta' });
    expect(headers.map((entry) => entry.organizationId)).toEqual(['acme', 'beta']);
  });

  test('workspaces use resolves a slug, saves its ID and can be cleared', async () => {
    const stale = await run(['config', 'set', 'organization-id', 'org_gone']);
    expect(stale.code, stale.stdout).toBe(0);

    const used = await run(['workspaces', 'use', 'beta']);
    expect(used.code, used.stdout).toBe(0);
    expect(JSON.parse(used.stdout)).toEqual({ status: 'set', organizationId: 'org_beta', slug: 'beta', name: 'Beta' });
    // Discovery must not send the stale selection, or the API would reject it.
    expect(headers).toEqual([{ path: '/v1/me/workspaces', organizationId: null }]);

    const config = await run(['config', 'get', 'organization-id']);
    expect(JSON.parse(config.stdout)).toEqual({ 'organization-id': 'org_beta' });

    await run(['skills', 'list']);
    expect(headers.at(-1)).toEqual({ path: '/v1/skills', organizationId: 'org_beta' });

    const missing = await run(['workspaces', 'use', 'nope']);
    expect(missing.code).toBe(5);
    expect(JSON.parse(missing.stdout).error).toContain('notra workspaces list');

    const cleared = await run(['workspaces', 'use', '--clear']);
    expect(cleared.code, cleared.stdout).toBe(0);
    await run(['skills', 'list']);
    expect(headers.at(-1)).toEqual({ path: '/v1/skills', organizationId: null });
  });

  test('workspaces use refuses OAuth sessions, which stay bound to one workspace', async () => {
    const { path } = JSON.parse((await run(['config', 'path'])).stdout);
    await Bun.write(path, JSON.stringify({
      accessToken: 'oauth_token', refreshToken: 'refresh', accessTokenExpiresAt: Date.now() + 3_600_000,
      organizationId: 'org_acme', authClientId: 'client', authIssuer: 'https://oauth.usenotra.com',
    }));
    const result = await run(['workspaces', 'use', 'beta'], { NOTRA_API_KEY: undefined });
    expect(result.code).toBe(2);
    expect(JSON.parse(result.stdout).error).toContain('notra auth login');
    expect(headers).toEqual([]);
  });

  test('workspaces use --clear needs no token refresh', async () => {
    const { path } = JSON.parse((await run(['config', 'path'])).stdout);
    await Bun.write(path, JSON.stringify({
      accessToken: 'oauth_token', refreshToken: 'refresh', accessTokenExpiresAt: 0,
      authClientId: 'client', authIssuer: server.url.origin, selectedOrganizationId: 'org_beta',
    }));
    const result = await run(['workspaces', 'use', '--clear'], { NOTRA_API_KEY: undefined });
    expect(result.code, result.stdout).toBe(0);
    expect(headers).toEqual([]);
    expect(JSON.parse((await run(['config', 'get', 'organization-id'])).stdout)).toEqual({ 'organization-id': null });
  });

  test('explains a selected workspace the key can no longer reach', async () => {
    const result = await run(['whoami', '--org', 'org_gone']);
    expect(result.code).toBe(3);
    const output = JSON.parse(result.stdout);
    expect(output.error).toBe('Your credentials no longer have access to the selected workspace.');
    expect(output.detail).toContain('notra workspaces list');
  });
});
