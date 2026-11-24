import { Command, Flags } from '../../cli/core';
import { resolveSiteSource } from '../../utils/site-source';
import { assertSitesNode, mountArgs, runSitesRuntime } from '../../utils/sites-runtime';

export default class SitesValidate extends Command {
  static override description = 'Check a local Notra Sites folder: blog.json, MDX, snippets, and links. No login required.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --mount blog=/newsroom',
    '<%= config.bin %> <%= command.id %> --source ./hosted-site --json',
  ];

  static override flags = {
    source: Flags.string({ description: 'Site folder. Defaults to the current directory.', default: '.' }),
    mount: Flags.string({
      description: 'Check a section at a path, like blog=/newsroom, the way sites build serves it. Repeatable.',
      helpValue: '<area>=<path>',
      multiple: true,
    }),
    origin: Flags.string({
      description: 'Public origin the site is served from, so links to it are checked as site links.',
      helpValue: '<url>',
    }),
    json: Flags.boolean({ description: 'Print diagnostics and entries as JSON.' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SitesValidate);
    assertSitesNode('sites validate');
    const source = await resolveSiteSource(flags.source);
    const { code } = await runSitesRuntime([
      'validate', '--source', source,
      ...mountArgs(flags.mount),
      ...(flags.origin === undefined ? [] : ['--origin', flags.origin]),
      ...(flags.json ? ['--json'] : []),
    ]);
    process.exitCode = code ?? 1;
  }
}
