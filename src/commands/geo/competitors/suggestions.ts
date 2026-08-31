import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';

export default class GeoCompetitorsSuggestions extends NotraCommand {
  static override description = 'Suggest GEO competitors for a domain.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    domain: Flags.string({ description: 'Website domain, for example example.com.', required: true }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoCompetitorsSuggestions);
    const response = await this.geo().request(
      'GET',
      `/v1/projects/${encodeURIComponent(args.projectId)}/geo/competitors/suggestions`,
      { query: { domain: flags.domain } },
    );
    this.printJson(response);
  }
}
