import { afterAll, beforeAll, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCliProcess } from '../utils/cli-test';

const schedule = {
  id: 'schedule_1',
  organizationId: 'org_1',
  name: 'Weekly Linear recap',
  sourceType: 'cron',
  sourceConfig: { cron: { frequency: 'weekly', hour: 9, minute: 0, dayOfWeek: 1 } },
  targets: { repositoryIds: [], linearIntegrationIds: ['lin_1'] },
  outputType: 'blog_post',
  outputConfig: null,
  enabled: false,
  autoPublish: false,
  lookbackWindow: 'last_7_days',
  createdAt: '2026-11-08T00:00:00.000Z',
  updatedAt: '2026-11-08T00:00:00.000Z',
};
const organization = { id: 'org_1', slug: 'acme', name: 'Acme', logo: null };

let server: ReturnType<typeof Bun.serve>;
let home: string;
let last: { method: string; path: string; body: unknown } | undefined;

beforeAll(async () => {
  home = await mkdtemp(join(tmpdir(), 'notra-schedules-'));
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      last = { method: request.method, path: new URL(request.url).pathname, body: await request.json() };
      return Response.json({ schedule, organization });
    },
  });
});

afterAll(async () => {
  server?.stop(true);
  await rm(home, { recursive: true, force: true });
});

function run(args: string[], input?: string) {
  last = undefined;
  const child = Bun.spawn([process.execPath, 'src/run.ts', ...args, '--base-url', server.url.href, '--json'], {
    stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
    env: { ...process.env, HOME: home, XDG_CONFIG_HOME: home, NOTRA_API_KEY: 'test_key', NOTRA_BASE_URL: undefined, NOTRA_ORGANIZATION_ID: undefined },
  });
  if (input !== undefined) child.stdin.write(input);
  child.stdin.end();
  return readCliProcess(child);
}

test('update sends only the fields to change', async () => {
  const result = await run(['schedules', 'update', 'schedule_1', '--config-file', '-'], '{"enabled":false}');
  expect(result.code, result.stdout + result.stderr).toBe(0);
  expect(last).toEqual({ method: 'PATCH', path: '/v1/schedules/schedule_1', body: { enabled: false } });
});

test('update can change Linear targets and clear output settings', async () => {
  const body = { targets: { linearIntegrationIds: [] }, outputConfig: { instructions: null, notify: { slack: true, email: false } } };
  const result = await run(['schedules', 'update', 'schedule_1', '--config-file', '-'], JSON.stringify(body));
  expect(result.code, result.stdout + result.stderr).toBe(0);
  expect(last?.body).toEqual(body);
});

test('update without fields fails locally', async () => {
  const result = await run(['schedules', 'update', 'schedule_1', '--config-file', '-'], '{}');
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stdout).error).toContain('Provide at least one field to update.');
  expect(last).toBeUndefined();
});

test('create accepts Linear-only targets from flags', async () => {
  const result = await run([
    'schedules', 'create', '--name', 'Weekly Linear recap', '--frequency', 'weekly', '--day-of-week', '1',
    '--hour', '9', '--minute', '0', '--output-type', 'blog_post', '--linear-integration', 'lin_1',
  ]);
  expect(result.code, result.stdout + result.stderr).toBe(0);
  expect(last).toEqual({
    method: 'POST',
    path: '/v1/schedules',
    body: {
      name: 'Weekly Linear recap',
      sourceType: 'cron',
      sourceConfig: { cron: { frequency: 'weekly', hour: 9, minute: 0, dayOfWeek: 1 } },
      targets: { linearIntegrationIds: ['lin_1'] },
      outputType: 'blog_post',
      enabled: true,
    },
  });
});

test('create without a GitHub or Linear source fails locally', async () => {
  const flags = await run([
    'schedules', 'create', '--name', 'No source', '--frequency', 'daily', '--hour', '9', '--minute', '0',
    '--output-type', 'changelog',
  ]);
  expect(flags.code).toBe(2);
  expect(JSON.parse(flags.stdout).error).toContain('--repository or --linear-integration is required');

  const file = await run(['schedules', 'create', '--config-file', '-'], JSON.stringify({
    name: 'No source', sourceType: 'cron', sourceConfig: { cron: { frequency: 'daily', hour: 9, minute: 0 } },
    targets: { repositoryIds: [], linearIntegrationIds: [] }, outputType: 'changelog', enabled: true,
  }));
  expect(file.code).toBe(2);
  expect(JSON.parse(file.stdout).error).toContain('Select at least one GitHub or Linear integration.');
  expect(last).toBeUndefined();
});

test('update cannot remove every GitHub and Linear source', async () => {
  const both = await run(
    ['schedules', 'update', 'schedule_1', '--config-file', '-'],
    '{"targets":{"repositoryIds":[],"linearIntegrationIds":[]}}',
  );
  expect(both.code).toBe(2);
  expect(JSON.parse(both.stdout).error).toContain('A schedule needs at least one GitHub or Linear integration.');
  expect(last).toBeUndefined();

  // Clearing one source is fine: the schedule may keep the other.
  const one = await run(['schedules', 'update', 'schedule_1', '--config-file', '-'], '{"targets":{"repositoryIds":[]}}');
  expect(one.code, one.stdout + one.stderr).toBe(0);
  expect(last?.body).toEqual({ targets: { repositoryIds: [] } });
});

test('misspelled fields still fail locally', async () => {
  const result = await run(['schedules', 'update', 'schedule_1', '--config-file', '-'], '{"enable":false}');
  expect(result.code).toBe(2);
  expect(JSON.parse(result.stdout).error).toContain('Unrecognized key');
  expect(last).toBeUndefined();
});
