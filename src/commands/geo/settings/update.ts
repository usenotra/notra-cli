import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { readJsonFromFileOrStdin } from '../../../utils/files';

export default class GeoSettingsUpdate extends NotraCommand {
  static override description = "Replace a project's GEO settings.";

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read the full settings body from a JSON file (or "-" for stdin).',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoSettingsUpdate);
    const body = await readJsonFromFileOrStdin(
      flags['config-file'],
      'Expected GEO settings JSON via --config-file or piped on stdin.',
    );
    const response = await this.geo().request(
      'PATCH',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/settings`,
      { body },
    );

    this.printJson(response);
  }
}
