import { Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { redactGeoToken } from '../../../utils/redact-geo-token';

export default class GeoTrafficToken extends NotraCommand {
  static override description = 'Issue an AI traffic ingest token.';

  static override flags = {
    project: Flags.string({ description: 'Bind the token to a GEO project ID.' }),
    'show-token': Flags.boolean({
      description: 'Print the issued token. Treat output as a secret.',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(GeoTrafficToken);
    const response = await this.geo().request('POST', '/v1/geo/ingest/token', {
      query: { projectId: flags.project },
    });

    if (this.emitJson() || flags['show-token']) {
      this.printJson(flags['show-token'] ? response : redactGeoToken(response));
      return;
    }

    this.printSuccess('Traffic ingest token issued. Token value hidden in interactive mode.');
    if (typeof response !== 'object' || response === null) return;

    const ingestUrl = Reflect.get(response, 'ingestUrl');
    if (typeof ingestUrl === 'string') this.log(`Ingest URL: ${ingestUrl}`);

    const snippets = Reflect.get(response, 'snippets');
    if (typeof snippets !== 'object' || snippets === null) return;
    for (const [framework, snippet] of Object.entries(snippets)) {
      if (typeof snippet === 'string') this.log(`\n${framework}:\n${snippet}`);
    }
  }
}
