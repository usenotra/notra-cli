import { afterAll, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCliProcess } from '../utils/cli-test';

const root = await mkdtemp(join(tmpdir(), 'notra-sites-renderer-'));
afterAll(() => rm(root, { recursive: true, force: true }));
const env = { ...process.env };
delete env.NOTRA_SITES_RUNTIME;
const cli = join(import.meta.dir, '..', 'run.ts');

async function site(name: string) {
  const source = join(root, name);
  await mkdir(join(source, 'blog'), { recursive: true });
  await mkdir(join(source, 'changelog'));
  await writeFile(join(source, 'blog', 'hello.mdx'), '---\ntitle: "Hello"\ndate: 2026-10-26\n---\n\nNewsroom post.\n');
  await writeFile(join(source, 'changelog', 'first.mdx'), '---\ntitle: "First release"\ndate: 2026-10-26\n---\n\nRelease notes.\n');
  return source;
}

function run(args: string[], cwd: string) {
  return readCliProcess(Bun.spawn([process.execPath, cli, ...args], { cwd, env, stdout: 'pipe', stderr: 'pipe' }));
}

test('the shipped renderer supports every flag the CLI forwards', async () => {
  const result = await readCliProcess(Bun.spawn([
    process.execPath, join(import.meta.dir, '..', '..', 'sites', 'dist', 'cli.mjs'), '--help',
  ], { env, stdout: 'pipe', stderr: 'pipe' }));
  expect(result.code).toBe(0);
  for (const flag of ['--mount <area>=<path>', '--origin <url>', '--out <dir>', '--json']) {
    expect(result.stdout).toContain(flag);
  }
  expect(result.stdout).toContain('build [--source <dir>] --out <dir> [--target <file>]');
});

test('sites build writes only the mounted section under its path in ./.notra/out', async () => {
  const source = await site('newsroom');
  const result = await run(['sites', 'build', '--mount', 'blog=/newsroom'], source);
  expect(result.code, result.stderr).toBe(0);
  expect(result.stderr).toContain('Built blog at /newsroom');
  const out = join(source, '.notra', 'out');
  expect(await readdir(out)).toContain('newsroom');
  expect(await readdir(out)).not.toContain('changelog');
  const page = await readFile(join(out, 'newsroom', 'hello', 'index.html'), 'utf8');
  expect(page).toContain('Newsroom post.');
  expect(page).toContain('href="http://localhost/newsroom/hello"');
  expect(page).toContain('content="noindex, nofollow"');

  const validate = await run(['sites', 'validate', '--json'], source);
  expect(validate.code, validate.stderr).toBe(0);
  expect(JSON.parse(validate.stdout).ok).toBe(true);
}, 120_000);

test('sites validate and build fail on a broken site and an invalid mount', async () => {
  const source = await site('broken');
  await writeFile(join(source, 'blog.json'), '{ "name": ');
  const validate = await run(['sites', 'validate'], source);
  expect(validate.code).toBe(1);
  expect(validate.stderr).toContain('blog.json');
  expect(validate.stderr).toContain('Validation failed');

  const build = await run(['sites', 'build', '--mount', 'blog=newsroom'], source);
  expect(build.code).toBe(1);
  expect(build.stderr.trim()).toBe('--mount blog=newsroom: the path must start with /');
}, 60_000);
