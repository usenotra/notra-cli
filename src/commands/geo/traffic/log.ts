import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoTrafficLog extends NotraCommand {
  static override description = 'Get recent AI traffic events.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    limit: Flags.integer({ description: 'Maximum events to return.', min: 1, max: 200 }),
    'visitor-types': Flags.string({
      description: 'Visitor types to include.',
      options: ['crawler', 'ai_referral'],
      multiple: true,
      delimiter: ',',
    }),
    categories: Flags.string({
      description: 'Traffic categories to include.',
      options: ['training-crawler', 'search-index', 'assistant-browse'],
      multiple: true,
      delimiter: ',',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoTrafficLog);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/traffic/log`,
      {
        query: {
          limit: flags.limit,
          visitorTypes: flags['visitor-types']?.join(','),
          categories: flags.categories?.join(','),
        },
      },
    );

    this.printJson(response);
  }
}
