import { afterAll, beforeAll, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

let root = '';
const children: ReturnType<typeof Bun.spawn>[] = [];
const node = Bun.which('node');

beforeAll(async () => {
  if (!node) throw new Error('Node is required to verify Node-only CLI startup');
  root = await mkdtemp(join(tmpdir(), 'notra-dev-process-'));
  await mkdir(join(root, 'npm'), { recursive: true });
  await mkdir(join(root, 'site with spaces ü', 'blog'), { recursive: true });
  const result = await Bun.build({
    entrypoints: [resolve('src/run.ts'), resolve('src/commands/dev.ts'), resolve('src/utils/sites-dev-launch.ts')],
    root: resolve('src'),
    outdir: join(root, 'cli'),
    target: 'node',
    format: 'esm',
    splitting: true,
  });
  if (!result.success) throw new Error(result.logs.map(String).join('\n'));
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  await writeFile(join(root, 'npm', 'npm-cli.js'), `
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
writeFileSync(process.env.LAUNCH_RECORD, JSON.stringify({ args, pid: process.pid }));
const runtime = args[args.indexOf('--package') + 1];
const child = spawn(process.execPath, [runtime, ...args.slice(args.indexOf('--') + 2)], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
if (process.env.MANAGER_EXIT) {
  const timer = setInterval(() => {
    if (existsSync(process.env.WORKER_RECORD)) {
      clearInterval(timer);
      process.exit(Number(process.env.MANAGER_EXIT));
    }
  }, 10);
}
`);
  await writeFile(join(root, 'runtime.mjs'), `
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.RUNTIME_RECORD, JSON.stringify({ args: process.argv.slice(2), pid: process.pid }));
if (process.env.RUNTIME_EXIT) process.exit(Number(process.env.RUNTIME_EXIT));
const worker = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
writeFileSync(process.env.WORKER_RECORD, String(worker.pid));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  writeFileSync(process.env.SIGNAL_RECORD, signal);
  worker.kill(signal);
  process.exit(0);
});
console.log('fake runtime ready');
setInterval(() => {}, 1000);
`);
});

afterAll(async () => {
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  await Promise.all(children.map(child => child.exited));
  await rm(root, { recursive: true, force: true });
});

test('Node forwards source and port to the package manager and runtime', async () => {
  const record = join(root, 'forward');
  const child = Bun.spawn([node!, join(root, 'cli/run.js'), 'dev', '--source', join(root, 'site with spaces ü'), '--port', '4400'], {
    env: {
      ...process.env,
      npm_execpath: join(root, 'npm/npm-cli.js'),
      NOTRA_SITES_DEV_PACKAGE: join(root, 'runtime.mjs'),
      LAUNCH_RECORD: `${record}-launch`, RUNTIME_RECORD: `${record}-runtime`, RUNTIME_EXIT: '0',
    },
    stdout: 'pipe', stderr: 'pipe',
  });
  children.push(child);
  expect(await child.exited).toBe(0);
  const launch = JSON.parse(await readFile(`${record}-launch`, 'utf8'));
  expect(launch.args).toEqual(['exec', '--yes', '--package', join(root, 'runtime.mjs'), '--', 'notra-sites', 'dev', '--source', join(root, 'site with spaces ü'), '--port', '4400']);
  const runtime = JSON.parse(await readFile(`${record}-runtime`, 'utf8'));
  expect(runtime.args).toEqual(['dev', '--source', join(root, 'site with spaces ü'), '--port', '4400']);
});

test('Node preserves unsuccessful runtime exit codes', async () => {
  const record = join(root, 'failure');
  const child = Bun.spawn([node!, join(root, 'cli/run.js'), 'dev', '--source', join(root, 'site with spaces ü')], {
    env: { ...process.env, npm_execpath: join(root, 'npm/npm-cli.js'), NOTRA_SITES_DEV_PACKAGE: join(root, 'runtime.mjs'), LAUNCH_RECORD: `${record}-launch`, RUNTIME_RECORD: `${record}-runtime`, RUNTIME_EXIT: '7' },
    stdout: 'pipe', stderr: 'pipe',
  });
  children.push(child);
  const stderr = new Response(child.stderr).text();
  expect(await child.exited).toBe(7);
  expect(await stderr).toContain('Notra Sites preview exited with code 7.');
});

test('Node finds its native npm CLI despite an inherited non-npm package manager path', async () => {
  const installation = join(root, 'node-installation');
  const nativeNpm = join(installation, 'node_modules/npm/bin/npm-cli.js');
  await mkdir(join(installation, 'node_modules/npm/bin'), { recursive: true });
  await writeFile(nativeNpm, '');
  const child = Bun.spawn([node!, '--input-type=module', '-e', `
Object.defineProperty(process, 'execPath', { value: ${JSON.stringify(join(installation, 'node.exe'))} });
Object.defineProperty(process, 'platform', { value: 'win32' });
process.env.npm_execpath = ${JSON.stringify(join(root, 'pnpm/pnpm.cjs'))};
const { sitesDevLaunch } = await import(${JSON.stringify(join(root, 'cli/utils/sites-dev-launch.js'))});
console.log(JSON.stringify(sitesDevLaunch('runtime', 'site with spaces', 4400)));
`], { stdout: 'pipe', stderr: 'pipe' });
  children.push(child);
  const output = new Response(child.stdout).text();
  expect(await child.exited).toBe(0);
  expect(JSON.parse(await output)).toEqual({
    command: join(installation, 'node.exe'),
    args: [nativeNpm, 'exec', '--yes', '--package', 'runtime', '--', 'notra-sites', 'dev', '--source', 'site with spaces', '--port', '4400'],
  });
});

test.skipIf(process.platform === 'win32')('Node cleans up descendants when the package manager fails first', async () => {
  const record = join(root, 'manager-failure');
  const child = Bun.spawn([node!, join(root, 'cli/run.js'), 'dev', '--source', join(root, 'site with spaces ü')], {
    env: { ...process.env, npm_execpath: join(root, 'npm/npm-cli.js'), NOTRA_SITES_DEV_PACKAGE: join(root, 'runtime.mjs'), LAUNCH_RECORD: `${record}-launch`, RUNTIME_RECORD: `${record}-runtime`, WORKER_RECORD: `${record}-worker`, SIGNAL_RECORD: `${record}-signal`, MANAGER_EXIT: '7' },
    stdout: 'pipe', stderr: 'pipe',
  });
  children.push(child);
  const stderr = new Response(child.stderr).text();
  expect(await child.exited).toBe(7);
  expect(await stderr).toContain('Notra Sites preview exited with code 7.');
  const runtime = JSON.parse(await readFile(`${record}-runtime`, 'utf8'));
  const worker = Number(await readFile(`${record}-worker`, 'utf8'));
  await Bun.sleep(100);
  for (const pid of [runtime.pid, worker]) expect(() => process.kill(pid, 0)).toThrow();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test.skipIf(process.platform === 'win32')(`Node ${signal} shuts down the package manager, runtime and descendant`, async () => {
    const record = join(root, signal);
    const child = Bun.spawn([node!, join(root, 'cli/run.js'), 'dev', '--source', join(root, 'site with spaces ü')], {
      env: { ...process.env, npm_execpath: join(root, 'npm/npm-cli.js'), NOTRA_SITES_DEV_PACKAGE: join(root, 'runtime.mjs'), LAUNCH_RECORD: `${record}-launch`, RUNTIME_RECORD: `${record}-runtime`, WORKER_RECORD: `${record}-worker`, SIGNAL_RECORD: `${record}-signal` },
      stdout: 'pipe', stderr: 'pipe',
    });
    children.push(child);
    const reader = child.stdout.getReader();
    let output = '';
    while (!output.includes('fake runtime ready')) {
      const { value, done } = await reader.read();
      if (done) throw new Error(await new Response(child.stderr).text());
      output += new TextDecoder().decode(value);
    }
    child.kill(signal);
    const code = await child.exited;
    if (code !== 0) process.stderr.write(await new Response(child.stderr).text());
    expect(code).toBe(0);
    expect(await readFile(`${record}-signal`, 'utf8')).toBe(signal);
    const launch = JSON.parse(await readFile(`${record}-launch`, 'utf8'));
    const runtime = JSON.parse(await readFile(`${record}-runtime`, 'utf8'));
    const worker = Number(await readFile(`${record}-worker`, 'utf8'));
    await Bun.sleep(100);
    for (const pid of [launch.pid, runtime.pid, worker]) {
      expect(() => process.kill(pid, 0)).toThrow();
    }
  });
}
