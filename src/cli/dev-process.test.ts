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
  await mkdir(join(root, 'site with spaces ü', 'blog'), { recursive: true });
  const result = await Bun.build({
    entrypoints: ['run.ts', 'commands/dev.ts', 'commands/sites/dev.ts', 'commands/sites/build.ts', 'commands/sites/validate.ts']
      .map((file) => resolve('src', file)),
    root: resolve('src'),
    outdir: join(root, 'cli'),
    target: 'node',
    format: 'esm',
    splitting: true,
  });
  if (!result.success) throw new Error(result.logs.map(String).join('\n'));
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  await writeFile(join(root, 'runtime.mjs'), `
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.RUNTIME_RECORD, JSON.stringify({ args: process.argv.slice(2), pid: process.pid }));
if (process.env.RUNTIME_EXIT) process.exit(Number(process.env.RUNTIME_EXIT));
const worker = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
writeFileSync(process.env.WORKER_RECORD, String(worker.pid));
if (process.env.WORKER_EXIT) process.exit(Number(process.env.WORKER_EXIT));
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

function startDev(record: string, env: Record<string, string>, args: string[] = [], command = ['dev']) {
  const child = Bun.spawn([node!, join(root, 'cli/run.js'), ...command, '--source', join(root, 'site with spaces ü'), ...args], {
    env: {
      ...process.env,
      NOTRA_SITES_RUNTIME: join(root, 'runtime.mjs'),
      RUNTIME_RECORD: `${record}-runtime`, WORKER_RECORD: `${record}-worker`, SIGNAL_RECORD: `${record}-signal`,
      ...env,
    },
    stdout: 'pipe', stderr: 'pipe',
  });
  children.push(child);
  return child;
}

test('Node forwards source and port to the bundled runtime', async () => {
  const record = join(root, 'forward');
  expect(await startDev(record, { RUNTIME_EXIT: '0' }, ['--port', '4400']).exited).toBe(0);
  const runtime = JSON.parse(await readFile(`${record}-runtime`, 'utf8'));
  expect(runtime.args).toEqual(['dev', '--source', join(root, 'site with spaces ü'), '--port', '4400']);
});

test('Node forwards --mount to the bundled runtime, also as sites dev', async () => {
  for (const command of [['dev'], ['sites', 'dev']]) {
    const record = join(root, `mount-${command.length}`);
    const child = startDev(record, { RUNTIME_EXIT: '0' }, ['--mount', 'blog=/newsroom', '--mount', 'changelog=/releases'], command);
    expect(await child.exited).toBe(0);
    const runtime = JSON.parse(await readFile(`${record}-runtime`, 'utf8'));
    expect(runtime.args).toEqual([
      'dev', '--source', join(root, 'site with spaces ü'), '--port', '4321',
      '--mount', 'blog=/newsroom', '--mount', 'changelog=/releases',
    ]);
  }
});

test('Node forwards sites build flags with an absolute output folder', async () => {
  const record = join(root, 'build');
  const child = startDev(record, { RUNTIME_EXIT: '0' }, [
    '--out', 'relative out', '--mount', 'blog=/newsroom', '--origin', 'https://www.example.com', '--json',
  ], ['sites', 'build']);
  expect(await child.exited).toBe(0);
  const runtime = JSON.parse(await readFile(`${record}-runtime`, 'utf8'));
  expect(runtime.args).toEqual([
    'build', '--source', join(root, 'site with spaces ü'), '--out', resolve('relative out'),
    '--mount', 'blog=/newsroom', '--origin', 'https://www.example.com', '--json',
  ]);
});

test('Node defaults the build output to ./.notra/out and forwards validate', async () => {
  const build = join(root, 'build-default');
  expect(await startDev(build, { RUNTIME_EXIT: '0' }, [], ['sites', 'build']).exited).toBe(0);
  expect(JSON.parse(await readFile(`${build}-runtime`, 'utf8')).args)
    .toEqual(['build', '--source', join(root, 'site with spaces ü'), '--out', resolve('.notra/out')]);
  const validate = join(root, 'validate');
  expect(await startDev(validate, { RUNTIME_EXIT: '0' }, ['--json'], ['sites', 'validate']).exited).toBe(0);
  expect(JSON.parse(await readFile(`${validate}-runtime`, 'utf8')).args)
    .toEqual(['validate', '--source', join(root, 'site with spaces ü'), '--json']);
});

test('Node passes a failed build or validation exit code through without extra output', async () => {
  for (const command of ['build', 'validate']) {
    const child = startDev(join(root, `${command}-failure`), { RUNTIME_EXIT: '1' }, [], ['sites', command]);
    const stderr = new Response(child.stderr).text();
    expect(await child.exited).toBe(1);
    expect(await stderr).toBe('');
  }
});

test('Node preserves unsuccessful runtime exit codes', async () => {
  const child = startDev(join(root, 'failure'), { RUNTIME_EXIT: '7' });
  const stderr = new Response(child.stderr).text();
  expect(await child.exited).toBe(7);
  expect(await stderr).toContain('Notra Sites preview exited with code 7.');
});

test.skipIf(process.platform === 'win32')('Node cleans up descendants when the runtime fails', async () => {
  const record = join(root, 'runtime-failure');
  expect(await startDev(record, { WORKER_EXIT: '7' }).exited).toBe(7);
  const worker = Number(await readFile(`${record}-worker`, 'utf8'));
  await Bun.sleep(100);
  expect(() => process.kill(worker, 0)).toThrow();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  test.skipIf(process.platform === 'win32')(`Node ${signal} shuts down the runtime and descendant`, async () => {
    const record = join(root, signal);
    const child = startDev(record, {});
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
    const runtime = JSON.parse(await readFile(`${record}-runtime`, 'utf8'));
    const worker = Number(await readFile(`${record}-worker`, 'utf8'));
    await Bun.sleep(100);
    for (const pid of [runtime.pid, worker]) {
      expect(() => process.kill(pid, 0)).toThrow();
    }
  });
}
