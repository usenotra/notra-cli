import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';
import { confirmDestructive } from '../../../utils/confirm';

export default class GeoCompetitorsDelete extends NotraCommand {
  static override description = 'Stop tracking a GEO competitor.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    name: Args.string({ description: 'Competitor name.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ description: 'Skip the interactive confirmation.', char: 'y' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoCompetitorsDelete);
    const confirmed = await confirmDestructive(`Delete GEO competitor ${args.name}?`, {
      yes: flags.yes,
    });
    if (!confirmed) this.error('Aborted.', { exit: ExitCode.Generic });

    const response = await this.geo().request(
      'DELETE',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/competitors/${encodeURIComponent(args.name)}`,
      {},
    );
    this.printJson(response);
  }
}
