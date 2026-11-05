import { Command, Flags } from '../../cli/core';
import { resolveSiteSource } from '../../utils/site-source';
import { assertSitesNode, runSitesRuntime } from '../../utils/sites-runtime';

export default class SitesValidate extends Command {
  static override description = 'Check a local Notra Sites folder: blog.json, MDX, and snippets. No login required.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --source ./hosted-site --json',
  ];

  static override flags = {
    source: Flags.string({ description: 'Site folder. Defaults to the current directory.', default: '.' }),
    json: Flags.boolean({ description: 'Print diagnostics and entries as JSON.' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SitesValidate);
    assertSitesNode('sites validate');
    const source = await resolveSiteSource(flags.source);
    const { code } = await runSitesRuntime(['validate', '--source', source, ...(flags.json ? ['--json'] : [])]);
    process.exitCode = code ?? 1;
  }
}
