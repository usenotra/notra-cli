import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoPromptsList extends NotraCommand {
  static override description = 'List tracked GEO prompts.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoPromptsList);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/prompts`,
    );

    this.printJson(response);
  }
}
