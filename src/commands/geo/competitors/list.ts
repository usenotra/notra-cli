import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoCompetitorsList extends NotraCommand {
  static override description = 'List tracked GEO competitors.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoCompetitorsList);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/competitors`,
      {},
    );
    this.printJson(response);
  }
}
