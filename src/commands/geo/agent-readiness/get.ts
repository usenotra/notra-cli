import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoAgentReadinessGet extends NotraCommand {
  static override description = 'Get the latest GEO agent-readiness report.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoAgentReadinessGet);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/agent-readiness`,
      {},
    );
    this.printJson(response);
  }
}
