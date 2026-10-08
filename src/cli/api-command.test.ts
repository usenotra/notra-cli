import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { API_COMMAND_FIXTURES, POST_GENERATION_RESPONSE } from '../constants/api-command-fixtures';
import { readCliProcess } from '../utils/cli-test';
import { startInterruptedStreamServer } from '../utils/http-test';
import { createApiCommand } from './api-command';
import { schedulePostRequestSchema } from '../schemas/post-schedule';

describe('curated API commands end to end', () => {
  let directory: string;
  let server: ReturnType<typeof Bun.serve>;
  let requests = 0;
  let errorStatus = 0;
  let lastBody: unknown;
  let lastAuthorization: string | null;
  let serveSnapshot = false;
  let chatError = false;
  let streamHang = false;
  const root = join(import.meta.dir, '../..');

  test('command defaults must reference a declared flag', () => {
    expect(() => createApiCommand('listSkills', { defaults: { typo: true } })).toThrow('Unknown default flag');
  });

  test('body overrides require an operation with a documented request body', () => {
    expect(() => createApiCommand('listSkills', { bodySchema: schedulePostRequestSchema })).toThrow('no request body to override');
  });

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'notra-cli-test-'));
    const build = await readCliProcess(Bun.spawn(['bun', 'run', 'build'], { cwd: root, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' }));
    expect(build.code, build.stderr).toBe(0);
    server = Bun.serve({
      hostname: '127.0.0.1', port: 0,
      async fetch(request) {
        requests++;
        if (errorStatus) return Response.json({ error: 'Mock API error' }, { status: errorStatus });
        const url = new URL(request.url);
        const body = request.method === 'GET' || request.method === 'DELETE' ? null : await request.json().catch(() => null);
        lastBody = body;
        lastAuthorization = request.headers.get('authorization');
        if (serveSnapshot) {
          if (url.pathname.endsWith('/visibility/overview')) return Response.json({
            organization: POST_GENERATION_RESPONSE.organization, configured: true, engines: [],
          });
          return Response.json({ error: 'Optional unavailable' }, { status: 503 });
        }
        if (url.pathname === '/v1/posts/generate') return Response.json(POST_GENERATION_RESPONSE);
        if (url.pathname.endsWith('/stream')) {
          if (streamHang) return new Response(new ReadableStream({ start(controller) {
            controller.enqueue(new TextEncoder().encode('{"type":"pending"}\n'));
          } }));
          return new Response('{"type":"text.delta","text":"Hallo 🌍"}\n{"type":"done"}', { headers: { 'content-type': 'application/x-ndjson' } });
        }
        if ((url.pathname === '/v1/chats' || url.pathname === '/v1/chats/chat_1') && request.method === 'POST') {
          if (chatError) return new Response('data: {"type":"error","errorText":"No credits"}\n\n');
          return new Response('data: {"type":"start","messageMetadata":{"chatId":"chat_1"}}\n\ndata: {"type":"text-delta","delta":"Hallo "}\n\ndata: {"type":"text-delta","textDelta":"Welt"}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
        }
        return Response.json({ method: request.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body, authorization: request.headers.get('authorization') });
      },
    });
  });

  afterAll(async () => {
    server?.stop(true);
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  function run(args: string[], built = false, input?: string, authenticated = true, baseUrl = server.url.href) {
    const child = Bun.spawn([built ? 'node' : 'bun', built ? 'dist/run.js' : 'src/run.ts', ...args, '--base-url', baseUrl, '--json'], {
      cwd: root, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
      env: { ...process.env, HOME: directory, XDG_CONFIG_HOME: directory, NOTRA_API_KEY: authenticated ? 'test_key' : undefined, NOTRA_BASE_URL: undefined },
    });
    if (input !== undefined) child.stdin.write(input);
    child.stdin.end();
    return readCliProcess(child);
  }

  for (const built of [false, true]) {
    for (const fixture of API_COMMAND_FIXTURES) {
      test(`${built ? 'built/node' : 'source/bun'}: ${fixture.command}`, async () => {
        const result = await run([...fixture.command.split(' '), ...(fixture.args ?? []), '--yes'], built);
        expect(result.code, result.stdout + result.stderr).toBe(0);
        expect(result.stderr).toBe('');
        if (fixture.chat) {
          expect(JSON.parse(result.stdout)).toEqual({ chatId: 'chat_1', text: 'Hallo Welt' });
          expect(lastBody).toEqual(fixture.body);
          expect(lastAuthorization).toBe('Bearer test_key');
        } else if (fixture.stream) {
          expect(result.stdout.trim().split('\n').map((line) => JSON.parse(line))).toEqual([{ type: 'text.delta', text: 'Hallo 🌍' }, { type: 'done' }]);
        } else {
          expect(JSON.parse(result.stdout)).toEqual({
            method: fixture.method ?? 'GET', path: fixture.path,
            query: fixture.query ?? {}, body: fixture.body ?? null, authorization: 'Bearer test_key',
          });
        }
      });
    }
  }

  test('every command is discoverable and has working source and built help', async () => {
    const files = [...new Bun.Glob('**/*.ts').scanSync({ cwd: join(root, 'src/commands') })];
    for (const file of files) {
      const command = file.replace(/\.ts$/, '').split('/');
      for (const built of [false, true]) {
        const result = await run([...command, '--help'], built);
        expect(result.code, `${file}: ${result.stderr}`).toBe(0);
        expect(result.stdout).toContain(`Usage: notra ${command.join(' ')}`);
        expect(result.stdout).not.toContain('<%=');
      }
    }
    expect(API_COMMAND_FIXTURES.length).toBe(44);
  }, 30_000);

  test('body stdin, field overrides and explicit false preserve nested data', async () => {
    const result = await run(['chats', 'create', '--body-file', '-', '--message', 'Override', '--no-enable-thinking', '--yes'], false,
      JSON.stringify({ message: 'Original', enableThinking: true, context: [{ type: 'mcp-server', integrationId: 'mcp_1', name: 'Tools' }] }));
    expect(result.code, result.stdout).toBe(0);
    expect(JSON.parse(result.stdout).text).toBe('Hallo Welt');
    expect(lastBody).toEqual({ message: 'Override', enableThinking: false, context: [{ type: 'mcp-server', integrationId: 'mcp_1', name: 'Tools' }] });
  });

  test('skill content files and post markdown stdin are accepted', async () => {
    const path = join(directory, 'skill.md');
    await Bun.write(path, '# Write naturally');
    const skill = await run(['skills', 'create', '--name', 'natural', '--description', 'Natural prose', '--content-file', path]);
    expect(skill.code, skill.stdout).toBe(0);
    expect(JSON.parse(skill.stdout).body.content).toBe('# Write naturally');
    const post = await run(['posts', 'create', '--title', 'Draft', '--content-type', 'blog_post', '--markdown-file', '-'], false, '# Markdown');
    expect(post.code, post.stdout).toBe(0);
    expect(JSON.parse(post.stdout).body.markdown).toBe('# Markdown');
  });

  test('public organization feedback works without authentication', async () => {
    const result = await run(['feedback', 'submit-public', 'acme', '--message', 'A bug'], false, undefined, false);
    expect(result.code, result.stdout).toBe(0);
    expect(JSON.parse(result.stdout).authorization).toBeNull();
  });

  test('source and packaged scheduling accept UTC offsets from flags and JSON', async () => {
    for (const built of [false, true]) {
      const scheduledAt = '2027-01-01T08:00:00+01:00';
      const result = await run(['posts', 'schedule', 'post_1', '--scheduled-at', scheduledAt], built);
      expect(result.code, result.stdout).toBe(0);
      expect(JSON.parse(result.stdout).body.scheduledAt).toBe(scheduledAt);

      const input = { scheduledAt: '2027-01-01T08:00:00.123-07:00', timeZone: 'America/Los_Angeles' };
      const json = await run(['posts', 'schedule', 'post_1', '--body-file', '-'], built, JSON.stringify(input));
      expect(json.code, json.stdout).toBe(0);
      expect(JSON.parse(json.stdout).body).toEqual({ ...input, destinations: [] });
    }
  });

  test('post generation accepts full source selection and merges explicit integration flags', async () => {
    const input = {
      contentType: 'changelog', timezone: 'UTC',
      integrations: { linear: ['linear_1'] },
      github: { repositories: [{ owner: 'acme', repo: 'app' }] },
      dataPoints: { includeCommits: false, includePullRequests: true },
      selectedItems: { commitShas: ['sha_1'], pullRequestNumbers: [{ repositoryId: 'repo_1', number: 7 }] },
    };
    for (const built of [false, true]) {
      const result = await run(['posts', 'generate', '--body-file', '-', '--github-integration', 'repo_1', '--timezone', 'Europe/Berlin'], built, JSON.stringify(input));
      expect(result.code, result.stdout).toBe(0);
      expect(JSON.parse(result.stdout).jobId).toBe('job_1');
      expect(lastBody).toEqual({
        contentType: input.contentType, timezone: 'Europe/Berlin',
        dataPoints: input.dataPoints, selectedItems: input.selectedItems,
        integrations: { github: ['repo_1'], linear: ['linear_1'] },
      });
    }
  });

  test('integration flags replace legacy or stored selectors without losing the other source', async () => {
    for (const built of [false, true]) {
      const legacy = { contentType: 'changelog', repositoryIds: ['old_repo'], linearIntegrationIds: ['old_linear'] };
      const result = await run([
        'posts', 'generate', '--body-file', '-', '--github-integration', 'repo_1', '--linear-integration', 'linear_1',
      ], built, JSON.stringify(legacy));
      expect(result.code, result.stdout).toBe(0);
      expect(lastBody).toEqual({ contentType: 'changelog', integrations: { github: ['repo_1'], linear: ['linear_1'] } });

      const stored = { contentType: 'changelog', integrations: { github: ['old_repo'], linear: ['linear_1'] } };
      const updated = await run(['posts', 'generate', '--body-file', '-', '--github-integration', 'repo_1'], built, JSON.stringify(stored));
      expect(updated.code, updated.stdout).toBe(0);
      expect(lastBody).toEqual({ contentType: 'changelog', integrations: { github: ['repo_1'], linear: ['linear_1'] } });
    }
  });

  test('body-only generation preserves valid selector combinations', async () => {
    for (const selectors of [
      { github: { repositories: [{ owner: 'acme', repo: 'app' }] }, integrations: { linear: ['linear_1'] } },
      { repositoryIds: ['repo_1'], linearIntegrationIds: ['linear_1'] },
      { integrations: { github: ['repo_1'], linear: ['linear_1'] } },
    ]) {
      const input = { contentType: 'changelog', ...selectors };
      for (const built of [false, true]) {
        const result = await run(['posts', 'generate', '--body-file', '-'], built, JSON.stringify(input));
        expect(result.code, result.stdout).toBe(0);
        expect(lastBody).toEqual(input);
      }
    }
  });

  test('conflicting generation selectors fail locally without overrides', async () => {
    for (const selectors of [
      { repositoryIds: ['repo_1'], integrations: { github: ['repo_2'] } },
      { repositoryIds: ['repo_1'], github: { repositories: [{ owner: 'acme', repo: 'app' }] } },
      { integrations: { github: ['repo_1'] }, github: { repositories: [{ owner: 'acme', repo: 'app' }] } },
      { linearIntegrationIds: ['linear_1'], integrations: { linear: ['linear_2'] } },
    ]) {
      for (const built of [false, true]) {
        const before = requests;
        const result = await run(['posts', 'generate', '--body-file', '-'], built, JSON.stringify({ contentType: 'changelog', ...selectors }));
        expect(result.code, result.stdout).toBe(2);
        expect(JSON.parse(result.stdout).error).toContain('Provide only one');
        expect(requests).toBe(before);
      }
    }
  });

  test('source and packaged GEO snapshot report optional warnings', async () => {
    serveSnapshot = true;
    try {
      for (const built of [false, true]) {
        const result = await run(['geo', 'snapshot', 'project_1', '--days', '30'], built);
        expect(result.code, result.stdout).toBe(0);
        const snapshot = JSON.parse(result.stdout);
        expect(snapshot.warnings).toHaveLength(7);
        expect(snapshot.visibility.mentionRate).toBe(0);
        expect(snapshot.recommendedNextActions[0].action).toBe('run_geo_scan');
      }
    } finally { serveSnapshot = false; }
  });

  test('chat stream failures propagate to the CLI exit code', async () => {
    chatError = true;
    try {
      const result = await run(['chats', 'create', '--message', 'Hello', '--yes']);
      expect(result.code).toBe(1);
      expect(JSON.parse(result.stdout).error).toBe('No credits');
    } finally { chatError = false; }
  });

  test('live event streams emit a JSON timeout error after partial output', async () => {
    streamHang = true;
    try {
      const result = await run(['agents', 'events', 'session_1', '--timeout', '1']);
      expect(result.code, result.stdout).toBe(6);
      const lines = result.stdout.trim().split('\n').map((line) => JSON.parse(line));
      expect(lines[0]).toEqual({ type: 'pending' });
      expect(lines[1].error).toBe('Request timed out.');
    } finally { streamHang = false; }
  });

  test('source and packaged event streams exit with a network error after a disconnect', async () => {
    const interrupted = await startInterruptedStreamServer();
    try {
      for (const built of [false, true]) {
        const result = await run(['agents', 'events', 'session_1'], built, undefined, true, interrupted.baseUrl);
        expect(result.code, result.stdout).toBe(6);
        expect(result.stderr).toBe('');
        const lines = result.stdout.trim().split('\n').map((line) => JSON.parse(line));
        expect(lines[0]).toEqual({ type: 'pending' });
        expect(lines[1].error).toBe('Could not reach the Notra API.');
      }
    } finally {
      interrupted.server.close();
    }
  });

  test('source and packaged buffered responses use the same network exit code', async () => {
    const interrupted = await startInterruptedStreamServer();
    try {
      for (const built of [false, true]) {
        const result = await run(['skills', 'list'], built, undefined, true, interrupted.baseUrl);
        expect(result.code, result.stdout).toBe(6);
        expect(JSON.parse(result.stdout).error).toBe('Could not reach the Notra API.');
        expect(result.stderr).toBe('');
      }
    } finally {
      interrupted.server.close();
    }
  });

  test('authenticated commands reject missing credentials', async () => {
    const before = requests;
    const result = await run(['skills', 'list'], false, undefined, false);
    expect(result.code).toBe(3);
    expect(JSON.parse(result.stdout).error).toContain('Not signed in');
    expect(requests).toBe(before);
  });

  test('destructive and billable commands cannot run noninteractively without --yes', async () => {
    for (const args of [
      ['skills', 'delete', 'humanizer'], ['posts', 'schedule-cancel', 'post_1'],
      ['webhooks', 'endpoints', 'delete', 'endpoint_1'], ['chats', 'create', '--message', 'Hello'],
      ['agents', 'create', '--message', 'Hello'], ['api', 'call', 'createChat', '--body-file', '-'],
      ['api', 'request', 'POST', '/v2/eve/v1/session', '--body-file', '-'],
    ]) {
      const before = requests;
      const result = await run(args, false, '{"message":"Hello"}');
      expect(result.code, result.stdout).toBe(2);
      expect(JSON.parse(result.stdout).error).toContain('Confirmation required');
      expect(requests).toBe(before);
    }
  });

  test('invalid requests fail locally with usage errors', async () => {
    for (const args of [
      ['posts', 'create', '--title', 'Draft', '--content-type', 'image'],
      ['posts', 'create', '--title', '', '--content-type', 'blog_post'],
      ['posts', 'create', '--title', 'Draft'],
      ['posts', 'create', '--title', 'Draft', '--content-type', 'linkedin_post', '--slug', 'not-allowed'],
      ['skills', 'update', 'humanizer'],
      ['skills', 'create', '--name', 'Bad Name'],
      ['webhooks', 'endpoints', 'create', '--url', 'not-a-url', '--events', 'invalid'],
      ['webhooks', 'endpoints', 'create', '--url', 'http://example.com/hooks', '--events', 'post.created'],
      ['geo', 'sentiment', 'get', 'project_1', '--days', '0'],
      ['geo', 'sentiment', 'get', 'project_1', '--from', 'not-a-date'],
      ['geo', 'visibility', 'prompt-summaries', 'project_1', '--mentioned', 'maybe'],
      ['event-triggers', 'create', '--targets', '{broken'],
      ['chats', 'create', '--yes'],
      ['chats', 'create', '--message', 'Hi', '--approvals', '[{"id":"approval_1","approved":true}]', '--yes'],
      ['agents', 'message', 'session_1', '--yes'],
      ['agents', 'events', 'session_1', '--start-index', '-1'],
      ['skills', 'create', '--body-file', '-'],
      ['skills', 'create', '--name', 'humanizer', '--content', 'a', '--content-file', 'b'],
    ]) {
      const before = requests;
      const result = await run(args, false, 'null');
      expect(result.code, `${args.join(' ')}: ${result.stdout}`).toBe(2);
      expect(JSON.parse(result.stdout).error).toBeTruthy();
      expect(requests).toBe(before);
    }
  });

  test('API failures retain documented JSON output and exit codes', async () => {
    try {
      for (const [status, exit] of [[401, 3], [403, 3], [404, 5], [429, 4], [500, 1]]) {
        errorStatus = status!;
        const result = await run(['webhooks', 'endpoints', 'list']);
        expect(result.code).toBe(exit!);
        expect(JSON.parse(result.stdout).error).toBe('Mock API error');
        expect(result.stderr).toBe('');
      }
    } finally { errorStatus = 0; }
  });
});
