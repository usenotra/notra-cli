import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { Command, Flags } from '../cli/core';
import { confirmAction } from '../utils/confirm';
import { resolveSiteSource } from '../utils/site-source';
import { createStarterSite } from '../utils/starter-site';
import { sitesRuntimePath } from '../utils/sites-runtime';

export default class Dev extends Command {
  static override description = 'Preview a local Notra Sites blog and changelog with live reload. No login required.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --source ./hosted-site --port 4400',
    '<%= config.bin %> <%= command.id %> --source ./my-site --init',
  ];

  static override flags = {
    source: Flags.string({ description: 'Site folder. Defaults to the current directory.', default: '.' }),
    port: Flags.integer({ description: 'Local preview port. Defaults to 4321.', default: 4321, min: 1, max: 65533, char: 'p' }),
    init: Flags.boolean({ description: 'Create a starter site when the folder has none, without asking.' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Dev);
    const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
    if (!process.versions.bun && (major < 22 || (major === 22 && minor < 12))) {
      this.error(
        `notra dev needs Node.js 22.12 or newer, but this is Node.js ${process.versions.node}. Update Node.js or run bunx --bun notra dev.`,
        { exit: 1 },
      );
    }
    const source = await resolveSiteSource(flags.source).catch(async (error: unknown) => {
      const folder = resolve(flags.source);
      const create = flags.init
        || await confirmAction(`No Notra site in ${folder}. Create a starter site here?`, { defaultAnswer: true });
      if (!create) throw error;
      const starter = await createStarterSite(folder);
      this.logToStderr(`Created a starter site in ${starter.root}: ${starter.files.join(', ')}`);
      return starter.root;
    });
    const runtime = sitesRuntimePath();
    this.logToStderr(`Starting Notra Sites preview for ${source}`);
    const child = spawn(process.execPath, [runtime, 'dev', '--source', source, '--port', String(flags.port)], {
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
    // Closing the terminal hangs up this process only; the detached preview
    // would keep running and hold the port.
    process.on('SIGINT', onInterrupt);
    process.on('SIGTERM', onTerminate);
    process.on('SIGHUP', onTerminate);
    try {
      const code = await new Promise<number | null>((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', resolve);
      });
      if (code !== 0 && !interrupted) {
        this.error(`Notra Sites preview exited with code ${code ?? 1}.`, { exit: code ?? 1 });
      }
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
}
