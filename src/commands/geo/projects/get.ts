import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoProjectsGet extends NotraCommand {
  static override description = 'Get a GEO project.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoProjectsGet);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}`,
    );

    this.printJson(response);
  }
}
