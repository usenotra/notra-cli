import { resolve } from 'node:path';
import { Command, Flags } from '../../cli/core';
import { resolveSiteSource } from '../../utils/site-source';
import { assertSitesNode, mountArgs, runSitesRuntime } from '../../utils/sites-runtime';

export default class SitesBuild extends Command {
  static override description = 'Build a local Notra Sites folder into the static output a hosted deployment serves. No login required.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --mount blog=/newsroom',
    '<%= config.bin %> <%= command.id %> --source ./hosted-site --out ./out --origin https://www.example.com',
  ];

  static override flags = {
    source: Flags.string({ description: 'Site folder. Defaults to the current directory.', default: '.' }),
    out: Flags.string({ description: 'Output folder, emptied first. Defaults to ./.notra/out.', default: '.notra/out' }),
    mount: Flags.string({
      description: 'Build a section at a path, like blog=/newsroom. Repeatable; only the sections listed are built.',
      helpValue: '<area>=<path>',
      multiple: true,
    }),
    origin: Flags.string({
      description: 'Public origin for canonical links, feeds, and sitemaps. Defaults to http://localhost.',
      helpValue: '<url>',
    }),
    json: Flags.boolean({ description: 'Print the build result as JSON.' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SitesBuild);
    assertSitesNode('sites build');
    const source = await resolveSiteSource(flags.source);
    const { code } = await runSitesRuntime([
      'build', '--source', source, '--out', resolve(flags.out),
      ...mountArgs(flags.mount),
      ...(flags.origin ? ['--origin', flags.origin] : []),
      ...(flags.json ? ['--json'] : []),
    ]);
    process.exitCode = code ?? 1;
  }
}
