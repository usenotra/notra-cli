import { afterEach, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSiteSource } from './site-source';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

for (const marker of ['blog.json', 'blog', 'changelog']) {
  test(`recognizes a site with ${marker}`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'notra-site-source-'));
    roots.push(root);
    if (marker === 'blog.json') await writeFile(join(root, marker), '{}');
    else await mkdir(join(root, marker));
    expect(await resolveSiteSource(root)).toBe(root);
  });
}

test('rejects unrelated folders, missing paths, and files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'notra-site-source-'));
  roots.push(root);
  await expect(resolveSiteSource(root)).rejects.toThrow('No Notra site found');
  await expect(resolveSiteSource(join(root, 'missing'))).rejects.toThrow('Site folder does not exist');
  await writeFile(join(root, 'file'), '');
  await expect(resolveSiteSource(join(root, 'file'))).rejects.toThrow('Site folder does not exist');
});

test('a file named blog or a directory named blog.json is not a site', async () => {
  const root = await mkdtemp(join(tmpdir(), 'notra-site-source-'));
  roots.push(root);
  await writeFile(join(root, 'blog'), '');
  await mkdir(join(root, 'blog.json'));
  await expect(resolveSiteSource(root)).rejects.toThrow('No Notra site found');
});
