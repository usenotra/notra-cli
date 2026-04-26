import { Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import type { ListSchedulesResponse } from '../../types/api';
import { formatBool, formatDate, renderTable, truncate } from '../../utils/output';

type Schedule = ListSchedulesResponse['schedules'][number];

export default class SchedulesList extends NotraCommand {
  static override description = 'List scheduled content-generation jobs.';
  static override examples = [
    '<%= config.bin %> schedules list',
    '<%= config.bin %> schedules list --repo repo_abc,repo_xyz',
  ];

  static override flags = {
    repo: Flags.string({ description: 'Comma-separated repository IDs to filter by.' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SchedulesList);

    const response = await this.client().schedules.listSchedules(
      flags.repo ? { repositoryIds: flags.repo } : undefined,
    );
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.log(
      renderTable<Schedule>(response.schedules, {
        columns: [
          { header: 'ID', get: (s) => s.id },
          { header: 'Name', get: (s) => truncate(s.name, 30) },
          { header: 'Output', get: (s) => s.outputType },
          { header: 'Cron', get: (s) => formatCron(s) },
          { header: 'Enabled', get: (s) => formatBool(s.enabled) },
          { header: 'Auto-publish', get: (s) => formatBool(s.autoPublish) },
          { header: 'Updated', get: (s) => formatDate(s.updatedAt) },
        ],
        empty: 'No schedules.',
      }),
    );
  }
}

function formatCron(s: Schedule): string {
  const c = s.sourceConfig.cron;
  const t = `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
  if (c.frequency === 'daily') return `daily @ ${t}`;
  if (c.frequency === 'weekly') return `weekly day ${c.dayOfWeek ?? '?'} @ ${t}`;
  if (c.frequency === 'monthly') return `monthly day ${c.dayOfMonth ?? '?'} @ ${t}`;
  return `${c.frequency} @ ${t}`;
}
