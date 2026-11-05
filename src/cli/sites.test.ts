import { expect, test } from 'bun:test';
import { parseArgv } from '../cli/core';
import { readCliProcess } from '../utils/cli-test';
import Dev from '../commands/dev';
import SitesBuild from '../commands/sites/build';
import SitesDev from '../commands/sites/dev';
import SitesValidate from '../commands/sites/validate';

test('sites dev is notra dev', () => {
  expect(SitesDev).toBe(Dev);
});

test('dev and build take repeatable --mount flags', () => {
  expect(parseArgv(['--mount', 'blog=/newsroom', '--mount=changelog=/releases'], {}, Dev.flags).flags)
    .toEqual({ source: '.', port: 4321, mount: ['blog=/newsroom', 'changelog=/releases'] });
  expect(parseArgv(['--mount', 'blog=/newsroom'], {}, SitesBuild.flags).flags.mount).toEqual(['blog=/newsroom']);
  expect(() => parseArgv(['--mount'], {}, SitesBuild.flags)).toThrow('Flag --mount expects a value.');
});

test('build has local defaults and accepts an output folder, origin, and JSON', () => {
  expect(parseArgv([], {}, SitesBuild.flags).flags).toEqual({ source: '.', out: '.notra/out' });
  expect(parseArgv(
    ['--source', './site', '--out', './out', '--origin', 'https://www.example.com', '--json'], {}, SitesBuild.flags,
  ).flags).toEqual({ source: './site', out: './out', origin: 'https://www.example.com', json: true });
});

test('validate takes a source and JSON only', () => {
  expect(parseArgv([], {}, SitesValidate.flags).flags).toEqual({ source: '.' });
  expect(parseArgv(['--source', './site', '--json'], {}, SitesValidate.flags).flags).toEqual({ source: './site', json: true });
  expect(() => parseArgv(['--mount', 'blog=/newsroom'], {}, SitesValidate.flags)).toThrow('Unknown flag');
});

test('sites help lists the commands without authentication', async () => {
  const result = await readCliProcess(Bun.spawn([
    process.execPath, 'src/run.ts', 'sites', '--help',
  ], { stdout: 'pipe', stderr: 'pipe' }));
  expect(result.code).toBe(0);
  for (const command of ['sites build', 'sites dev', 'sites validate']) expect(result.stdout).toContain(command);
});

test('build help shows the mount syntax and defaults', async () => {
  const result = await readCliProcess(Bun.spawn([
    process.execPath, 'src/run.ts', 'sites', 'build', '--help',
  ], { stdout: 'pipe', stderr: 'pipe' }));
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('Usage: notra sites build');
  expect(result.stdout).toContain('--mount <area>=<path>');
  expect(result.stdout).toContain('./.notra/out');
  expect(result.stdout).toContain('notra sites build --mount blog=/newsroom');
  expect(result.stdout).not.toContain('--api-key');
});

for (const command of ['validate', 'build']) {
  test(`sites ${command} in an unrelated directory gets an actionable error`, async () => {
    const result = await readCliProcess(Bun.spawn([
      process.execPath, 'src/run.ts', 'sites', command,
    ], { stdout: 'pipe', stderr: 'pipe' }));
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('No Notra site found');
    expect(result.stderr).not.toContain('API key');
  });
}
