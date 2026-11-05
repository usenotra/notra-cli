import { Command, Flags } from '../cli/core';
import { resolveSiteSource } from '../utils/site-source';
import { assertSitesNode, mountArgs, runSitesRuntime } from '../utils/sites-runtime';

export default class Dev extends Command {
  static override description = 'Preview a local Notra Sites blog and changelog with live reload. No login required.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --source ./hosted-site --port 4400',
    '<%= config.bin %> <%= command.id %> --mount blog=/newsroom',
  ];

  static override flags = {
    source: Flags.string({ description: 'Site folder. Defaults to the current directory.', default: '.' }),
    port: Flags.integer({ description: 'Local preview port. Defaults to 4321.', default: 4321, min: 1, max: 65533, char: 'p' }),
    mount: Flags.string({
      description: 'Serve a section at a path, like blog=/newsroom. Repeatable; only the sections listed are served.',
      helpValue: '<area>=<path>',
      multiple: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Dev);
    assertSitesNode('dev');
    const source = await resolveSiteSource(flags.source);
    this.logToStderr(`Starting Notra Sites preview for ${source}`);
    const { code, interrupted } = await runSitesRuntime([
      'dev', '--source', source, '--port', String(flags.port), ...mountArgs(flags.mount),
    ]);
    if (code !== 0 && !interrupted) {
      this.error(`Notra Sites preview exited with code ${code ?? 1}.`, { exit: code ?? 1 });
    }
  }
}
