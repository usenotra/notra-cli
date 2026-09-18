import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';
import { confirmAction } from '../../../utils/confirm';

export default class GeoSequencesRun extends NotraCommand {
  static override description = 'Run a GEO prompt sequence now.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    sequenceId: Args.string({ description: 'GEO sequence ID.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ char: 'y', description: 'Confirm use of AI credits.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoSequencesRun);
    const confirmed = await confirmAction('Run this billed GEO sequence?', { yes: flags.yes });
    if (!confirmed) {
      this.error('Confirmation required. Re-run with --yes.', { exit: ExitCode.Usage });
    }
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/sequences/${encodeURIComponent(args.sequenceId)}/run`,
      { timeoutMs: 300_000 },
    );

    this.printJson(response);
  }
}
