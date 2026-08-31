import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { readTextFromFileOrStdin } from '../../../utils/files';

export default class GeoCompetitorsImport extends NotraCommand {
  static override description = 'Bulk import GEO competitors from JSON or CSV.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read JSON or CSV from a file (or "-" for stdin).',
      required: true,
    }),
    format: Flags.string({
      description: 'Input format. Defaults to CSV for .csv files and JSON otherwise.',
      options: ['json', 'csv'],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoCompetitorsImport);
    const input = await readTextFromFileOrStdin(
      flags['config-file'],
      'Expected competitor JSON or CSV via --config-file or piped on stdin.',
    );
    const body = flags.format === 'csv' ||
      (flags.format === undefined && flags['config-file'].toLowerCase().endsWith('.csv'))
      ? { csv: input }
      : JSON.parse(input);
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/competitors/import`,
      { body },
    );
    this.printJson(response);
  }
}
