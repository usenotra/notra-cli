import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoGapsList extends NotraCommand {
  static override description = 'List content gaps for a GEO project.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoGapsList);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/gaps`,
      {},
    );

    this.printJson(response);
  }
}
