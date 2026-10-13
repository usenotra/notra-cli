import { spawn } from 'node:child_process';
import { Command, Flags } from '../cli/core';
import { SITES_DEV_PACKAGE } from '../constants/sites-dev';
import { resolveSiteSource } from '../utils/site-source';
import { sitesDevLaunch } from '../utils/sites-dev-launch';

export default class Dev extends Command {
  static override description = 'Preview a local Notra Sites blog and changelog with live reload. No login required.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --source ./hosted-site --port 4400',
  ];

  static override flags = {
    source: Flags.string({ description: 'Site folder. Defaults to the current directory.', default: '.' }),
    port: Flags.integer({ description: 'Local preview port. Defaults to 4321.', default: 4321, min: 1, max: 65533, char: 'p' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Dev);
    const source = await resolveSiteSource(flags.source);
    const runtime = process.env.NOTRA_SITES_DEV_PACKAGE || SITES_DEV_PACKAGE;
    this.logToStderr(`Starting Notra Sites preview for ${source}`);
    const launch = sitesDevLaunch(runtime, source, flags.port);
    const child = spawn(launch.command, launch.args, {
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
    process.on('SIGINT', onInterrupt);
    process.on('SIGTERM', onTerminate);
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
