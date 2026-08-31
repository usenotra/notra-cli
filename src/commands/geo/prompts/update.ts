import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';

export default class GeoPromptsUpdate extends NotraCommand {
  static override description = 'Enable or disable a tracked GEO prompt.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    promptId: Args.string({ description: 'GEO prompt ID.', required: true }),
  };

  static override flags = {
    enabled: Flags.boolean({
      description: 'Enable the prompt. Use --no-enabled to disable it.',
      allowNo: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoPromptsUpdate);
    if (flags.enabled === undefined) {
      this.error('Provide --enabled or --no-enabled.', { exit: ExitCode.Usage });
    }

    const response = await this.geo().request(
      'PATCH',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/prompts/${encodeURIComponent(args.promptId)}`,
      { body: { enabled: flags.enabled } },
    );

    this.printJson(response);
  }
}
