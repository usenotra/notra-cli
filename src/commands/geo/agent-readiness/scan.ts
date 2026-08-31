import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoAgentReadinessScan extends NotraCommand {
  static override description = 'Start a GEO agent-readiness scan.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoAgentReadinessScan);
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/agent-readiness/scan`,
      {},
    );
    this.printJson(response);
  }
}
