import { readFile } from 'node:fs/promises';
import { Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import type { CreateScheduleRequest } from '../../types/api';

const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
const OUTPUT_TYPES = ['changelog', 'blog_post', 'linkedin_post', 'twitter_post'] as const;
const PUBLISH_DESTINATIONS = ['webflow', 'framer', 'custom'] as const;
const LOOKBACK_WINDOWS = [
  'current_day',
  'yesterday',
  'last_7_days',
  'last_14_days',
  'last_30_days',
] as const;

export default class SchedulesCreate extends NotraCommand {
  static override description = 'Create a cron-based content-generation schedule.';
  static override examples = [
    [
      '<%= config.bin %> schedules create --name "Daily changelog"',
      '  --frequency daily --hour 9 --minute 0',
      '  --output-type changelog --repository repo_abc --enabled',
    ].join(' \\\n    '),
    '<%= config.bin %> schedules create --config-file ./schedule.json',
    'cat schedule.json | <%= config.bin %> schedules create --config-file -',
  ];

  static override flags = {
    'config-file': Flags.string({
      description:
        'Read the request body from a JSON file (or "-" for stdin). All other flags are ignored when set.',
    }),
    name: Flags.string({ description: 'Schedule name.' }),
    frequency: Flags.string({ description: 'Cron frequency.', options: [...FREQUENCIES] }),
    hour: Flags.integer({ description: 'Hour (0-23).', min: 0, max: 23 }),
    minute: Flags.integer({ description: 'Minute (0-59).', min: 0, max: 59 }),
    'day-of-week': Flags.integer({
      description: 'Day of week (0-6, required for weekly).',
      min: 0,
      max: 6,
    }),
    'day-of-month': Flags.integer({
      description: 'Day of month (1-31, required for monthly).',
      min: 1,
      max: 31,
    }),
    repository: Flags.string({
      description: 'Repository ID. Repeatable.',
      multiple: true,
    }),
    'output-type': Flags.string({
      description: 'Output content type.',
      options: [...OUTPUT_TYPES],
    }),
    'publish-destination': Flags.string({
      description: 'Publish destination.',
      options: [...PUBLISH_DESTINATIONS],
    }),
    'brand-voice': Flags.string({ description: 'Brand voice ID.' }),
    lookback: Flags.string({
      description: 'Lookback window for source data.',
      options: [...LOOKBACK_WINDOWS],
    }),
    enabled: Flags.boolean({
      description: 'Enable the schedule on create.',
      allowNo: true,
      default: true,
    }),
    'auto-publish': Flags.boolean({
      description: 'Auto-publish generated posts.',
      allowNo: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SchedulesCreate);

    const request = flags['config-file']
      ? await readConfigFile(flags['config-file'])
      : buildRequestFromFlags(flags);

    const response = await this.client().schedules.createSchedule(request);
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.printSuccess(`Created schedule ${response.schedule.id} (${response.schedule.name}).`);
  }
}

async function readConfigFile(path: string): Promise<CreateScheduleRequest> {
  const raw = path === '-' ? await readStdin() : await readFile(path, 'utf8');
  return JSON.parse(raw) as CreateScheduleRequest;
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new Error('Expected schedule JSON via --config-file or piped on stdin.');
  }
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

type CreateFlags = {
  name?: string;
  frequency?: string;
  hour?: number;
  minute?: number;
  'day-of-week'?: number;
  'day-of-month'?: number;
  repository?: string[];
  'output-type'?: string;
  'publish-destination'?: string;
  'brand-voice'?: string;
  lookback?: string;
  enabled?: boolean;
  'auto-publish'?: boolean;
};

function buildRequestFromFlags(flags: CreateFlags): CreateScheduleRequest {
  const required = (value: unknown, name: string): never | void => {
    if (value === undefined || value === null || value === '') {
      throw new Error(`--${name} is required when --config-file is not used.`);
    }
  };
  required(flags.name, 'name');
  required(flags.frequency, 'frequency');
  required(flags.hour, 'hour');
  required(flags.minute, 'minute');
  required(flags.repository?.length, 'repository');
  required(flags['output-type'], 'output-type');

  const cron: CreateScheduleRequest['sourceConfig']['cron'] = {
    frequency: flags.frequency as CreateScheduleRequest['sourceConfig']['cron']['frequency'],
    hour: flags.hour as number,
    minute: flags.minute as number,
  };
  if (flags.frequency === 'weekly') {
    if (flags['day-of-week'] === undefined) {
      throw new Error('--day-of-week is required for weekly schedules.');
    }
    cron.dayOfWeek = flags['day-of-week'];
  }
  if (flags.frequency === 'monthly') {
    if (flags['day-of-month'] === undefined) {
      throw new Error('--day-of-month is required for monthly schedules.');
    }
    cron.dayOfMonth = flags['day-of-month'];
  }

  const request: CreateScheduleRequest = {
    name: flags.name as string,
    sourceType: 'cron',
    sourceConfig: { cron },
    targets: { repositoryIds: flags.repository as string[] },
    outputType: flags[
      'output-type'
    ] as CreateScheduleRequest['outputType'],
    enabled: flags.enabled ?? true,
  };
  if (flags['auto-publish'] !== undefined) request.autoPublish = flags['auto-publish'];
  if (flags.lookback) {
    request.lookbackWindow = flags.lookback as CreateScheduleRequest['lookbackWindow'];
  }
  if (flags['publish-destination'] || flags['brand-voice']) {
    request.outputConfig = {};
    if (flags['publish-destination']) {
      request.outputConfig.publishDestination = flags[
        'publish-destination'
      ] as NonNullable<CreateScheduleRequest['outputConfig']>['publishDestination'];
    }
    if (flags['brand-voice']) request.outputConfig.brandVoiceId = flags['brand-voice'];
  }
  return request;
}
