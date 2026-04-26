import { readFile } from 'node:fs/promises';
import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import type { UpdateScheduleRequest } from '../../types/api';

export default class SchedulesUpdate extends NotraCommand {
  static override description = 'Replace a schedule with a new full body (PATCH semantics).';
  static override examples = [
    '<%= config.bin %> schedules update sched_abc --config-file ./schedule.json',
    'cat schedule.json | <%= config.bin %> schedules update sched_abc --config-file -',
  ];

  static override args = {
    scheduleId: Args.string({ description: 'Schedule ID.', required: true }),
  };

  static override flags = {
    'config-file': Flags.string({
      description: 'Read the request body from a JSON file (or "-" for stdin).',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SchedulesUpdate);
    const raw =
      flags['config-file'] === '-'
        ? await readStdin()
        : await readFile(flags['config-file'], 'utf8');
    const body = JSON.parse(raw) as UpdateScheduleRequest['body'];

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

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new Error('Expected schedule JSON via --config-file or piped on stdin.');
  }
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
