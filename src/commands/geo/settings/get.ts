import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoSettingsGet extends NotraCommand {
  static override description = "Get a project's GEO settings.";

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoSettingsGet);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/settings`,
    );

    this.printJson(response);
  }
}
