import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';

export default class GeoProjectsUpdate extends NotraCommand {
  static override description = 'Update a GEO project.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    name: Flags.string({ description: 'New project name.' }),
    'brand-settings-id': Flags.string({ description: 'Brand identity ID to link.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoProjectsUpdate);
    if (flags.name === undefined && flags['brand-settings-id'] === undefined) {
      this.error('Provide at least one field to update.', { exit: ExitCode.Usage });
    }

    const response = await this.geo().request(
      'PATCH',
      `/v1/projects/${encodeURIComponent(args.projectId)}`,
      {
        body: {
          ...(flags.name === undefined ? {} : { name: flags.name }),
          ...(flags['brand-settings-id'] === undefined
            ? {}
            : { brandSettingsId: flags['brand-settings-id'] }),
        },
      },
    );

    this.printJson(response);
  }
}
