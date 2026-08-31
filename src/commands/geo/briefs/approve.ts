import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoBriefsApprove extends NotraCommand {
  static override description = 'Approve a GEO content brief and start the writer.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    briefId: Args.string({ description: 'Content brief ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoBriefsApprove);
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/briefs/${encodeURIComponent(args.briefId)}/approve`,
      {},
    );
    this.printJson(response);
  }
}
