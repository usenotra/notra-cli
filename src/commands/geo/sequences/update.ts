import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';
import { readJsonFromFileOrStdin } from '../../../utils/files';

export default class GeoSequencesUpdate extends NotraCommand {
  static override description = 'Update a GEO prompt sequence.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    sequenceId: Args.string({ description: 'GEO sequence ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read the request body from a JSON file (or "-" for stdin).',
      exclusive: ['name', 'step', 'enabled'],
    }),
    name: Flags.string({ description: 'New sequence name.' }),
    step: Flags.string({ description: 'Replacement prompt step. Repeat for each turn.', multiple: true }),
    enabled: Flags.boolean({
      description: 'Enable the sequence. Use --no-enabled to disable it.',
      allowNo: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoSequencesUpdate);
    if (
      !flags['config-file'] &&
      flags.name === undefined &&
      flags.step === undefined &&
      flags.enabled === undefined
    ) {
      this.error('Provide at least one field to update, or use --config-file.', {
        exit: ExitCode.Usage,
      });
    }
    if (flags.step && flags.step.length > 5) {
      this.error('A sequence can contain at most five --step values.', {
        exit: ExitCode.Usage,
      });
    }

    const body = flags['config-file']
      ? await readJsonFromFileOrStdin(
          flags['config-file'],
          'Expected sequence JSON via --config-file or piped on stdin.',
        )
      : {
          ...(flags.name === undefined ? {} : { name: flags.name }),
          ...(flags.step === undefined ? {} : { steps: flags.step }),
          ...(flags.enabled === undefined ? {} : { enabled: flags.enabled }),
        };
    const response = await this.geo().request(
      'PATCH',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/sequences/${encodeURIComponent(args.sequenceId)}`,
      { body },
    );

    this.printJson(response);
  }
}
