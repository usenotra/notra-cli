import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoBriefsList extends NotraCommand {
  static override description = 'List GEO content briefs.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoBriefsList);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/briefs`,
      {},
    );
    this.printJson(response);
  }
}
