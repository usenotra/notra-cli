import { Args } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoScansGet extends NotraCommand {
  static override description = 'Get a GEO scan.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
    scanId: Args.string({ description: 'GEO scan ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GeoScansGet);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/scans/${encodeURIComponent(args.scanId)}`,
      {},
    );

    this.printJson(response);
  }
}
