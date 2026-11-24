import { resolve } from 'node:path';
import { Command, Flags } from '../cli/core';
import { confirmAction } from '../utils/confirm';
import { resolveSiteSource } from '../utils/site-source';
import { assertSitesNode, mountArgs, runSitesRuntime } from '../utils/sites-runtime';
import { createStarterSite } from '../utils/starter-site';

export default class Dev extends Command {
  static override description = 'Preview a local Notra Sites blog and changelog with live reload. No login required.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --source ./hosted-site --port 4400',
    '<%= config.bin %> <%= command.id %> --mount blog=/newsroom',
    '<%= config.bin %> <%= command.id %> --source ./my-site --create',
  ];

  static override flags = {
    source: Flags.string({ description: 'Site folder. Defaults to the current directory.', default: '.' }),
    port: Flags.integer({ description: 'Local preview port. Defaults to 4321.', default: 4321, min: 1, max: 65533, char: 'p' }),
    mount: Flags.string({
      description: 'Serve a section at a path, like blog=/newsroom. Repeatable; only the sections listed are served.',
      helpValue: '<area>=<path>',
      multiple: true,
    }),
    create: Flags.boolean({ description: 'Create a starter site when the folder has none, without asking.' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Dev);
    assertSitesNode('dev');
    const source = await resolveSiteSource(flags.source).catch(async (error: unknown) => {
      const folder = resolve(flags.source);
      const create = flags.create
        || await confirmAction(`No Notra site in ${folder}. Create a starter site here?`, { defaultAnswer: true });
      if (!create) throw error;
      const starter = await createStarterSite(folder);
      this.logToStderr(`Created a starter site in ${starter.root}: ${starter.files.join(', ')}`);
      return starter.root;
    });
    this.logToStderr(`Starting Notra Sites preview for ${source}`);
    const { code, interrupted } = await runSitesRuntime([
      'dev', '--source', source, '--port', String(flags.port), ...mountArgs(flags.mount),
    ]);
    if (code !== 0 && !interrupted) {
      this.error(`Notra Sites preview exited with code ${code ?? 1}.`, { exit: code ?? 1 });
    }
  }
}
