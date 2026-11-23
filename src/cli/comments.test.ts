import { afterAll, beforeAll, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCliProcess } from '../utils/cli-test';

const organization = { id: 'org_1', slug: 'acme', name: 'Acme', logo: null };

let server: ReturnType<typeof Bun.serve>;
let home: string;
let last: { method: string; path: string; query: string; body: unknown } | undefined;
let reads = 0;
const building = { status: 'ready', live: true, latestLive: false, deleting: false, errorMessage: null };

beforeAll(async () => {
  home = await mkdtemp(join(tmpdir(), 'notra-comments-'));
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      const text = await request.text();
      last = { method: request.method, path: url.pathname, query: url.search, body: text ? JSON.parse(text) : undefined };
      if (url.pathname === '/v1/post-comments') return Response.json({ posts: [], organization });
      if (url.pathname.endsWith('/replies')) return Response.json({ id: 'reply_1' }, { status: 201 });
      if (url.pathname.endsWith('/resolve')) return Response.json({ resolved: ['t1'], skipped: [] });
      if (url.pathname.endsWith('/comments')) return Response.json({ threads: [], openThreads: 0, organization });
      // The rebuild turns ready on the second read and goes live on the third.
      if (url.pathname === '/v1/sites/site_watch/post-previews/post_1') {
        reads += 1;
        return Response.json({ preview: { ...building, latestLive: reads >= 3 }, organization });
      }
      if (url.pathname === '/v1/sites/site_failed/post-previews/post_1') {
        return Response.json({ preview: { ...building, status: 'failed', live: false, errorMessage: 'Build failed' }, organization });
      }
      return Response.json({ preview: null, organization }, { status: request.method === 'POST' ? 202 : 200 });
    },
  });
});

afterAll(async () => {
  server?.stop(true);
  await rm(home, { recursive: true, force: true });
});

function run(args: string[]) {
  last = undefined;
  const child = Bun.spawn([process.execPath, 'src/run.ts', ...args, '--base-url', server.url.href, '--json'], {
    stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
    env: { ...process.env, HOME: home, XDG_CONFIG_HOME: home, NOTRA_API_KEY: 'test_key', NOTRA_BASE_URL: undefined, NOTRA_ORGANIZATION_ID: undefined },
  });
  child.stdin.end();
  return readCliProcess(child);
}

test('finds commented posts, optionally by a preview link', async () => {
  expect((await run(['comments', 'posts'])).code).toBe(0);
  expect(last).toMatchObject({ method: 'GET', path: '/v1/post-comments', query: '' });
  const link = 'https://post-abc--acme.notra.site/blog/launch';
  expect((await run(['comments', 'posts', '--link', link])).code).toBe(0);
  expect(last).toMatchObject({ path: '/v1/post-comments', query: `?link=${encodeURIComponent(link)}` });
});

test('reads, answers and resolves a post\'s threads', async () => {
  expect((await run(['comments', 'list', 'post_1', '--status', 'all'])).code).toBe(0);
  expect(last).toMatchObject({ method: 'GET', path: '/v1/posts/post_1/comments', query: '?status=all' });

  expect((await run(['comments', 'reply', 'post_1', 't1', '--body', 'Added an example.'])).code).toBe(0);
  expect(last).toEqual({ method: 'POST', path: '/v1/posts/post_1/comments/t1/replies', query: '', body: { body: 'Added an example.' } });

  expect((await run(['comments', 'resolve', 'post_1', '--thread-ids', 't1', '--thread-ids', 't2'])).code).toBe(0);
  expect(last).toEqual({ method: 'POST', path: '/v1/posts/post_1/comments/resolve', query: '', body: { threadIds: ['t1', 't2'] } });
});

test('previews a post without forcing a lifetime, and reads its status', async () => {
  expect((await run(['sites', 'preview', 'site_1', '--post-id', 'post_1'])).code).toBe(0);
  expect(last).toEqual({ method: 'POST', path: '/v1/sites/site_1/post-previews', query: '', body: { postId: 'post_1' } });
  expect((await run(['sites', 'preview-status', 'site_1', 'post_1'])).code).toBe(0);
  expect(last).toMatchObject({ method: 'GET', path: '/v1/sites/site_1/post-previews/post_1' });
});

test('--watch waits until the latest build is live, and fails on a failed build', async () => {
  reads = 0;
  const live = await run(['sites', 'preview-status', 'site_watch', 'post_1', '--watch', '--poll-interval', '1']);
  expect(live.code).toBe(0);
  expect(reads).toBe(3);
  const failed = await run(['sites', 'preview-status', 'site_failed', 'post_1', '--watch']);
  expect(failed.code).not.toBe(0);
});

test('rejects an empty reply before calling the API', async () => {
  const result = await run(['comments', 'reply', 'post_1', 't1', '--body', '']);
  expect(result.code).not.toBe(0);
  expect(last).toBeUndefined();
});

test('renders threads and commented posts for a terminal', async () => {
  const { renderPostComments, renderCommentedPosts } = await import('../utils/comments');
  const text = renderPostComments({
    openThreads: 1,
    threads: [{ id: 't1', quote: 'A first draft', author: 'Maya', body: 'Add an example', leftOn: 'preview', resolved: false, deleted: false, replies: [{ id: 'r1', author: 'Alex', body: 'Done' }] }],
  });
  expect(text).toContain('“A first draft”');
  expect(text).toContain('Maya: Add an example');
  expect(text).toContain('↳ Alex: Done');
  expect(renderCommentedPosts({ posts: [] })).toContain('No posts with open comments.');
  const more = renderCommentedPosts({
    posts: [{ postId: 'post_1', title: 'Launch', openThreads: 1, lastCommentAt: null }],
    hasMore: true,
  });
  expect(more).toContain('--page');
});
