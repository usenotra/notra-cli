import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSiteSource } from './site-source';
import { createStarterSite } from './starter-site';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

test('creates a missing folder with a blog, a changelog and blog.json named after it', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'notra-starter-'));
  roots.push(parent);
  const { root, files } = await createStarterSite(join(parent, 'acme-site'), new Date('2026-10-28T12:00:00Z'));
  expect(files).toEqual(['blog.json', 'blog/hello-world.mdx', 'changelog/2026-10-28-first-release.mdx']);
  expect(JSON.parse(await readFile(join(root, 'blog.json'), 'utf8')).name).toBe('acme-site');
  expect(await readFile(join(root, 'blog/hello-world.mdx'), 'utf8')).toContain('date: 2026-10-28');
  expect(await resolveSiteSource(root)).toBe(root);
});

test('never overwrites an existing file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'notra-starter-'));
  roots.push(root);
  await writeFile(join(root, 'blog.json'), '{"name":"Mine"}');
  await expect(createStarterSite(root)).rejects.toThrow('EEXIST');
  expect(await readFile(join(root, 'blog.json'), 'utf8')).toBe('{"name":"Mine"}');
});
