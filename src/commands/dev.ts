import { Command, Flags } from '../cli/core';
import { SITES_DEV_PACKAGE } from '../constants/sites-dev';
import { resolveSiteSource } from '../utils/site-source';

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
    const child = Bun.spawn([
      process.execPath, 'x', '--bun', '--package', runtime, 'notra-sites',
      'dev', '--source', source, '--port', String(flags.port),
    ], { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' });
    let interrupted = false;
    const stop = (signal: NodeJS.Signals) => {
      if (interrupted) return;
      interrupted = true;
      child.kill(signal);
    };
    const onInterrupt = () => stop('SIGINT');
    const onTerminate = () => stop('SIGTERM');
    process.on('SIGINT', onInterrupt);
    process.on('SIGTERM', onTerminate);
    try {
      const code = await child.exited;
      if (code !== 0 && !interrupted) {
        this.error(`Notra Sites preview exited with code ${code}.`, { exit: code });
      }
    } finally {
      process.removeListener('SIGINT', onInterrupt);
      process.removeListener('SIGTERM', onTerminate);
    }
  }
}
