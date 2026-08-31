import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';
import { confirmDestructive } from '../../../utils/confirm';

export default class GeoSequencesDelete extends NotraCommand {
  static override description = 'Delete a GEO prompt sequence.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    sequenceId: Args.string({ description: 'GEO sequence ID.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ description: 'Skip the interactive confirmation.', char: 'y' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoSequencesDelete);
    const confirmed = await confirmDestructive(`Delete GEO sequence ${args.sequenceId}?`, {
      yes: flags.yes,
    });
    if (!confirmed) this.error('Aborted.', { exit: ExitCode.Generic });

    const response = await this.geo().request(
      'DELETE',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/sequences/${encodeURIComponent(args.sequenceId)}`,
    );

    this.printJson(response);
  }
}
