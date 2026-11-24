import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Errors } from '../cli/core';
import type { SitesRuntimeResult } from '../types/sites';

// The Sites renderer ships in the package's sites/ folder, exported from the
// Notra monorepo. NOTRA_SITES_RUNTIME points at an unreleased build instead.
export function sitesRuntimePath(): string {
  if (process.env.NOTRA_SITES_RUNTIME) return resolve(process.env.NOTRA_SITES_RUNTIME);
  let directory = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(directory, 'package.json'))) {
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  const runtime = join(directory, 'sites', 'dist', 'cli.mjs');
  if (!existsSync(runtime)) {
    throw new Errors.CLIError('The Notra Sites renderer is missing from this installation. Reinstall notra.', { exit: 1 });
  }
  return runtime;
}

export function assertSitesNode(command: string): void {
  const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
  if (!process.versions.bun && (major < 22 || (major === 22 && minor < 12))) {
    throw new Errors.CLIError(
      `notra ${command} needs Node.js 22.12 or newer, but this is Node.js ${process.versions.node}. Update Node.js or run bunx --bun notra ${command}.`,
      { exit: 1 },
    );
  }
}

export function mountArgs(mounts: ReadonlyArray<string> | undefined): string[] {
  return (mounts ?? []).flatMap((mount) => ['--mount', mount]);
}

// Runs the renderer with the Node or Bun that started the CLI, in its own
// process group so Ctrl+C or a closed terminal also stops Astro and the other
// processes it starts.
export async function runSitesRuntime(args: ReadonlyArray<string>): Promise<SitesRuntimeResult> {
  const child = spawn(process.execPath, [sitesRuntimePath(), ...args], {
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });
  let interrupted = false;
  const stop = (signal: NodeJS.Signals) => {
    if (interrupted) return;
    interrupted = true;
    if (!child.pid) return;
    if (process.platform === 'win32') {
      const cleanup = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      cleanup.once('error', () => child.kill(signal));
      return;
    }
    try {
      process.kill(-child.pid, signal);
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) throw error;
    }
  };
  const onInterrupt = () => stop('SIGINT');
  const onTerminate = () => stop('SIGTERM');
  // Closing the terminal hangs up this process only; the detached renderer
  // would keep running and hold its port.
  process.on('SIGINT', onInterrupt);
  process.on('SIGTERM', onTerminate);
  process.on('SIGHUP', onTerminate);
  try {
    const code = await new Promise<number | null>((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', resolve);
    });
    return { code, interrupted };
  } finally {
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onTerminate);
    process.removeListener('SIGHUP', onTerminate);
    if (child.pid && !interrupted && process.platform !== 'win32') {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) throw error;
      }
    }
  }
}
