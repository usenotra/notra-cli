import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoTrafficOverview extends NotraCommand {
  static override description = 'Get AI traffic totals, sources, and daily trends.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    days: Flags.integer({ description: 'Rolling window size in days.', min: 1, max: 365 }),
    from: Flags.string({ description: 'Window start date (YYYY-MM-DD).' }),
    to: Flags.string({ description: 'Window end date (YYYY-MM-DD).' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoTrafficOverview);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/traffic/overview`,
      { query: { days: flags.days, from: flags.from, to: flags.to } },
    );

    this.printJson(response);
  }
}
