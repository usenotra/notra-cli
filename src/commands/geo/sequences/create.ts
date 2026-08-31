import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';
import { readJsonFromFileOrStdin } from '../../../utils/files';

export default class GeoSequencesCreate extends NotraCommand {
  static override description = 'Create a GEO prompt sequence.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read the request body from a JSON file (or "-" for stdin).',
      exclusive: ['name', 'step'],
    }),
    name: Flags.string({ description: 'Sequence name.' }),
    step: Flags.string({ description: 'Prompt step. Repeat for each turn.', multiple: true }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoSequencesCreate);
    if (!flags['config-file'] && (!flags.name || !flags.step?.length)) {
      this.error('Provide --name and at least one --step, or use --config-file.', {
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
      : { name: flags.name, steps: flags.step };
    const response = await this.geo().request(
      'POST',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/sequences`,
      { body },
    );

    this.printJson(response);
  }
}
