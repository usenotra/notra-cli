import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoVisibilityCompetitorShare extends NotraCommand {
  static override description = 'Get GEO share of voice across tracked brands.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    days: Flags.integer({ description: 'Rolling window size in days.', min: 1, max: 365 }),
    from: Flags.string({ description: 'Start date in YYYY-MM-DD format.' }),
    to: Flags.string({ description: 'End date in YYYY-MM-DD format.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoVisibilityCompetitorShare);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/visibility/competitor-share`,
      { query: { days: flags.days, from: flags.from, to: flags.to } },
    );

    this.printJson(response);
  }
}
