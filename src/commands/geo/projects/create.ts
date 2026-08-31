import { Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoProjectsCreate extends NotraCommand {
  static override description = 'Create a GEO project.';

  static override flags = {
    name: Flags.string({ description: 'Project name.', required: true }),
    'brand-settings-id': Flags.string({ description: 'Brand identity ID to link.' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(GeoProjectsCreate);
    const response = await this.geo().request('POST', '/v1/projects', {
      body: {
        name: flags.name,
        ...(flags['brand-settings-id'] === undefined
          ? {}
          : { brandSettingsId: flags['brand-settings-id'] }),
      },
    });

    this.printJson(response);
  }
}
