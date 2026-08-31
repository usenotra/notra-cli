import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { readJsonFromFileOrStdin } from '../../../utils/files';

export default class GeoCompetitorsUpsert extends NotraCommand {
  static override description = 'Create or update a tracked GEO competitor.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read the request body from a JSON file (or "-" for stdin).',
      exclusive: ['name', 'previous-name', 'domain', 'synonym', 'kind', 'color'],
    }),
    name: Flags.string({ description: 'Competitor name.' }),
    'previous-name': Flags.string({ description: 'Existing name when renaming a competitor.' }),
    domain: Flags.string({ description: 'Competitor domain.' }),
    synonym: Flags.string({ description: 'Competitor synonym. Repeatable.', multiple: true }),
    kind: Flags.string({ description: 'Competitor relationship.', options: ['direct', 'indirect'] }),
    color: Flags.string({ description: 'Competitor display color.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoCompetitorsUpsert);
    if (!flags['config-file'] && !flags.name) {
      this.error('--name is required when --config-file is not used.');
    }

    const body = flags['config-file']
      ? await readJsonFromFileOrStdin(
          flags['config-file'],
          'Expected competitor JSON via --config-file or piped on stdin.',
        )
      : {
          name: flags.name,
          previousName: flags['previous-name'],
          domain: flags.domain ?? null,
          synonyms: flags.synonym,
          kind: flags.kind,
          color: flags.color,
        };
    const response = await this.geo().request(
      'PUT',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/competitors`,
      { body },
    );
    this.printJson(response);
  }
}
