import { Args, Flags } from '../../cli/core';
import { NotraCommand } from '../../base-command';
import { loadGeoSnapshot } from '../../utils/geo-snapshot';
import { getOperation, prepareOperation } from '../../utils/api-command';

export default class GeoSnapshot extends NotraCommand {
  static override description = 'Get a compact GEO diagnosis and recommended next actions. Optional sections may return warnings.';
  static override args = { projectId: Args.string({ required: true, description: 'GEO project ID.' }) };
  static override flags = {
    days: Flags.integer({ min: 1, max: 365, description: 'Rolling window in days.' }),
    from: Flags.string({ description: 'Start date (YYYY-MM-DD).' }),
    to: Flags.string({ description: 'End date (YYYY-MM-DD).' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoSnapshot);
    prepareOperation(getOperation('getGeoVisibilityOverview'), args, flags);
    this.printJson(await loadGeoSnapshot(this.geo(), args.projectId, { days: flags.days, from: flags.from, to: flags.to }));
  }
}
