#!/usr/bin/env bun
import { Glob } from 'bun';
import { rm } from 'node:fs/promises';

const PRESERVE = new Set(['run.js', 'dev.js']);

const dist = new Glob('**/*');
for await (const entry of dist.scan({ cwd: 'dist' })) {
  if (PRESERVE.has(entry)) continue;
  await rm(`dist/${entry}`, { recursive: true, force: true });
}

const sources = new Glob('commands/**/*.ts');
const entrypoints: string[] = [];
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
