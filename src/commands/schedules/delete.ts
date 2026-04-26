import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { confirmDestructive } from '../../utils/confirm';

export default class SchedulesDelete extends NotraCommand {
  static override description = 'Delete a schedule.';
  static override examples = ['<%= config.bin %> schedules delete sched_abc --yes'];

  static override args = {
    scheduleId: Args.string({ description: 'Schedule ID.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ description: 'Skip the interactive confirmation.', char: 'y' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SchedulesDelete);
    const ok = await confirmDestructive(`Delete schedule ${args.scheduleId}?`, {
      yes: flags.yes,
    });
    if (!ok) this.error('Aborted.', { exit: 1 });

    const response = await this.client().schedules.deleteSchedule({
      scheduleId: args.scheduleId,
    });
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.printSuccess(`Deleted schedule ${response.id}.`);
  }
}
