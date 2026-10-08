import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCliProcess } from './cli-test';

test('auth lock recreates a missing config directory before saving', async () => {
  const home = await mkdtemp(join(tmpdir(), 'notra-first-setup-'));
  try {
    const child = Bun.spawn(['bun', '--eval', `
      import { rm } from 'node:fs/promises';
      import { dirname } from 'node:path';
      import { getConfigPath, getConfigValue, setConfigValue } from './src/lib/config.ts';
      import { withAuthLock } from './src/utils/auth-lock.ts';
      await rm(dirname(getConfigPath()), { recursive: true, force: true });
      await withAuthLock(() => setConfigValue('base-url', 'https://api.example.test'));
      console.log(getConfigValue('base-url'));
    `], {
      cwd: join(import.meta.dir, '../..'),
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: home, NOTRA_BASE_URL: undefined },
      stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
    });
    child.stdin.end();
    const result = await readCliProcess(child);
    expect(result.code, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('https://api.example.test');
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
