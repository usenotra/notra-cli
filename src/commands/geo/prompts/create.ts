import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoPromptsCreate extends NotraCommand {
  static override description = 'Track a new GEO prompt.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    prompt: Flags.string({ description: 'Prompt text to track.', required: true }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoPromptsCreate);
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/prompts`,
      { body: { prompt: flags.prompt } },
    );

    this.printJson(response);
  }
}
