import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoSequencesRun extends NotraCommand {
  static override description = 'Run a GEO prompt sequence now.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    sequenceId: Args.string({ description: 'GEO sequence ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoSequencesRun);
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/sequences/${encodeURIComponent(args.sequenceId)}/run`,
      { timeoutMs: 300_000 },
    );

    this.printJson(response);
  }
}
