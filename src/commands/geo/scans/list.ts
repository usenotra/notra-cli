import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoScansList extends NotraCommand {
  static override description = 'List GEO scans for a project.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    limit: Flags.integer({ description: 'Items per page.', min: 1, max: 100 }),
    page: Flags.integer({ description: 'Page number.', min: 1 }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoScansList);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/scans`,
      { query: { limit: flags.limit, page: flags.page } },
    );

    this.printJson(response);
  }
}
