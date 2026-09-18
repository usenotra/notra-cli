#!/usr/bin/env bun
import { Glob } from 'bun';
import { rm } from 'node:fs/promises';

// dist/ is fully generated, so wipe it wholesale. `force: true` keeps fresh
// checkouts (where dist/ does not exist yet) from failing with ENOENT, and
// Bun.build recreates the directory via `outdir`.
await rm('dist', { recursive: true, force: true });

const sources = new Glob('commands/**/*.ts');
const entrypoints: string[] = [];
entrypoints.push(`${process.cwd()}/src/run.ts`);
for await (const file of sources.scan({ cwd: 'src', absolute: true })) {
  if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) continue;
  entrypoints.push(file);
}

const result = await Bun.build({
  entrypoints,
  root: './src',
  outdir: './dist',
  target: 'node',
  format: 'esm',
  splitting: true,
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`Built ${result.outputs.length} files into dist/.`);
