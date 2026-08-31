import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';
import { confirmDestructive } from '../../../utils/confirm';

export default class GeoPromptsDelete extends NotraCommand {
  static override description = 'Stop tracking a GEO prompt.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    promptId: Args.string({ description: 'GEO prompt ID.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ description: 'Skip the interactive confirmation.', char: 'y' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoPromptsDelete);
    const confirmed = await confirmDestructive(`Delete GEO prompt ${args.promptId}?`, {
      yes: flags.yes,
    });
    if (!confirmed) this.error('Aborted.', { exit: ExitCode.Generic });

    const response = await this.geo().request(
      'DELETE',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/prompts/${encodeURIComponent(args.promptId)}`,
    );

    this.printJson(response);
  }
}
