import { expect, test } from 'bun:test';
import { parseArgv } from '../cli/core';
import { readCliProcess } from '../utils/cli-test';
import Dev from '../commands/dev';

test('dev has useful defaults and accepts a custom source and port', () => {
  expect(parseArgv([], {}, Dev.flags).flags).toEqual({ source: '.', port: 4321 });
  expect(parseArgv(['--source', './my site', '-p', '4400'], {}, Dev.flags).flags)
    .toEqual({ source: './my site', port: 4400 });
});

test('invalid ports and unknown flags fail before downloading the runtime', () => {
  for (const port of ['0', '65534', '-1', '4321.5', 'nope']) {
    expect(() => parseArgv(['--port', port], {}, Dev.flags)).toThrow();
  }
  expect(() => parseArgv(['--unknown'], {}, Dev.flags)).toThrow();
});

test('dev help works without authentication or a site', async () => {
  const result = await readCliProcess(Bun.spawn([
    process.execPath, 'src/run.ts', 'dev', '--help',
  ], { stdout: 'pipe', stderr: 'pipe' }));
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('Usage: notra dev');
  expect(result.stdout).toContain('--source');
  expect(result.stdout).toContain('--port');
  expect(result.stdout).not.toContain('--api-key');
});

test('an unrelated directory gets an actionable error without authentication', async () => {
  const result = await readCliProcess(Bun.spawn([
    process.execPath, 'src/run.ts', 'dev',
  ], { stdout: 'pipe', stderr: 'pipe' }));
  expect(result.code).toBe(2);
  expect(result.stderr).toContain('No Notra site found');
  expect(result.stderr).toContain('--source');
  expect(result.stderr).not.toContain('API key');
});
