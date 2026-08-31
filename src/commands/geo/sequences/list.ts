import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoSequencesList extends NotraCommand {
  static override description = 'List GEO prompt sequences.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoSequencesList);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/sequences`,
    );

    this.printJson(response);
  }
}
