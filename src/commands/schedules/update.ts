import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { validateUpdateScheduleBody } from '../../schemas/schedules';
import { readJsonFromFileOrStdin } from '../../utils/files';

export default class SchedulesUpdate extends NotraCommand {
  static override description =
    'Update a schedule. Send only the fields to change; omitted fields keep their value.';
  static override examples = [
    '<%= config.bin %> schedules update sched_abc --config-file ./schedule.json',
    `echo '{"enabled":false}' | <%= config.bin %> schedules update sched_abc --config-file -`,
    `echo '{"targets":{"linearIntegrationIds":["lin_abc"]}}' | <%= config.bin %> schedules update sched_abc --config-file -`,
  ];

  static override args = {
    scheduleId: Args.string({ description: 'Schedule ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read the fields to change from a JSON file (or "-" for stdin).',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SchedulesUpdate);
    const input = await readJsonFromFileOrStdin(
      flags['config-file'],
      'Expected schedule JSON via --config-file or piped on stdin.',
    );
    const body = validateUpdateScheduleBody(input);

    const response = await this.client().schedules.updateSchedule({
      scheduleId: args.scheduleId,
      body,
    });
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.printSuccess(`Updated schedule ${response.schedule.id}.`);
  }
}
