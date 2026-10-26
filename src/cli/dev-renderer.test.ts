import { afterAll, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = await mkdtemp(join(tmpdir(), 'notra-dev-renderer-'));
afterAll(() => rm(root, { recursive: true, force: true }));

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
    server.once('error', reject);
  });
}

test('dev serves a site through the shipped renderer and stops on SIGINT', async () => {
  const source = join(root, 'site');
  await mkdir(join(source, 'blog'), { recursive: true });
  await writeFile(join(source, 'blog', 'hello.mdx'), '---\ntitle: "Hello"\ndate: 2026-10-26\n---\n\nShipped renderer.\n');
  const port = await freePort();
  const env = { ...process.env };
  delete env.NOTRA_SITES_RUNTIME;
  const child = Bun.spawn([process.execPath, 'src/run.ts', 'dev', '--source', source, '--port', String(port)], {
    env, stdout: 'ignore', stderr: 'pipe',
  });
  const stderr = new Response(child.stderr).text();
  try {
    const deadline = Date.now() + 90_000;
    let body = '';
    while (Date.now() < deadline && !body.includes('Shipped renderer.')) {
      if (child.exitCode !== null) throw new Error(await stderr);
      const response = await fetch(`http://127.0.0.1:${port}/blog/hello`).catch(() => null);
      body = response?.ok ? await response.text() : '';
      if (!body) await Bun.sleep(250);
    }
    expect(body).toContain('Shipped renderer.');
    child.kill('SIGINT');
    expect(await child.exited).toBe(0);
  } finally {
    if (child.exitCode === null) child.kill('SIGKILL');
  }
}, 120_000);
