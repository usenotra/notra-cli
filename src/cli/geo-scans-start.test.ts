import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readCliProcess } from '../utils/cli-test';

describe('geo scans start --prompt --wait', () => {
  let directory: string;
  let server: ReturnType<typeof Bun.serve>;
  let finalStatus = 'completed';
  let polls = 0;
  const requests: string[] = [];
  const root = join(import.meta.dir, '../..');

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'notra-cli-scan-test-'));
    server = Bun.serve({
      hostname: '127.0.0.1', port: 0,
      fetch(request) {
        const { pathname } = new URL(request.url);
        requests.push(`${request.method} ${pathname}`);
        if (request.method === 'POST' && pathname === '/v1/projects/project_1/geo/scans/prompts/prompt_1') {
          return Response.json({ scanId: 'scan_1' });
        }
        if (request.method === 'GET' && pathname === '/v1/projects/project_1/geo/scans/scan_1') {
          polls++;
          return Response.json({ scan: { id: 'scan_1', status: polls === 1 ? 'running' : finalStatus } });
        }
        return Response.json({ error: 'Unexpected request' }, { status: 404 });
      },
    });
  });

  afterAll(async () => {
    server?.stop(true);
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  function run() {
    polls = 0;
    requests.length = 0;
    const child = Bun.spawn(['bun', 'src/run.ts', 'geo', 'scans', 'start', 'project_1', '--prompt', 'prompt_1', '--wait', '--poll-interval', '1', '--yes', '--base-url', server.url.href, '--json'], {
      cwd: root, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
      env: { ...process.env, HOME: directory, XDG_CONFIG_HOME: directory, NOTRA_API_KEY: 'test_key', NOTRA_BASE_URL: undefined, NOTRA_ORGANIZATION_ID: undefined },
    });
    child.stdin.end();
    return readCliProcess(child);
  }

  test('polls the prompt rescan until it completes', async () => {
    finalStatus = 'completed';
    const result = await run();
    expect(result.code, result.stdout + result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ scan: { id: 'scan_1', status: 'completed' } });
    expect(requests).toEqual([
      'POST /v1/projects/project_1/geo/scans/prompts/prompt_1',
      'GET /v1/projects/project_1/geo/scans/scan_1',
      'GET /v1/projects/project_1/geo/scans/scan_1',
    ]);
  });

  test('exits unsuccessfully when the prompt rescan fails', async () => {
    finalStatus = 'failed';
    const result = await run();
    expect(result.code).not.toBe(0);
    expect(JSON.parse(result.stdout).scan.status).toBe('failed');
  });
});
