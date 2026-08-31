import { NotraCommand } from '../../../base-command';

export default class GeoProjectsList extends NotraCommand {
  static override description = 'List GEO projects.';

  public async run(): Promise<void> {
    await this.parse(GeoProjectsList);
    const response = await this.geo().request('GET', '/v1/projects');

    this.printJson(response);
  }
}
