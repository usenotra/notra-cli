import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoBriefsGet extends NotraCommand {
  static override description = 'Get a GEO content brief.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    briefId: Args.string({ description: 'Content brief ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoBriefsGet);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/briefs/${encodeURIComponent(args.briefId)}`,
      {},
    );
    this.printJson(response);
  }
}
