import { NotraCommand } from '../../../base-command';

export default class GeoTrafficSetup extends NotraCommand {
  static override description = 'Get AI traffic ingest installation snippets.';

  public async run(): Promise<void> {
    await this.parse(GeoTrafficSetup);

    const response = await this.geo().request('GET', '/v1/geo/ingest/setup', {});

    if (this.emitJson()) {
      this.printJson(response);
      return;
    }

    this.printSuccess('Traffic ingest setup loaded.');
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
