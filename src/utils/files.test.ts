import { afterAll, beforeAll, expect, test } from 'bun:test';
import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeTextFileAtomically } from './files';

let directory: string;
beforeAll(async () => { directory = await mkdtemp(join(tmpdir(), 'notra-files-')); });
afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

test('atomic writes replace existing text and leave no temporary file', async () => {
  const parent = join(directory, 'success');
  await mkdir(parent);
  const target = pathToFileURL(join(parent, 'catalog.ts'));
  await writeTextFileAtomically(target, 'before');
  await writeTextFileAtomically(target, 'after');
  expect(await readFile(target, 'utf8')).toBe('after');
  expect(await readdir(parent)).toEqual(['catalog.ts']);
});

test('failed replacement preserves the target and cleans up temporary data', async () => {
  const parent = join(directory, 'failure');
  await mkdir(parent);
  const target = join(parent, 'existing-directory');
  await mkdir(target);
  await expect(writeTextFileAtomically(pathToFileURL(target), 'invalid')).rejects.toThrow();
  expect(await readdir(parent)).toEqual(['existing-directory']);
  expect(await readdir(target)).toEqual([]);
});
