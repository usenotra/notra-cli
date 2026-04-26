import { NotraCommand } from '../../base-command';
import { getConfigPath } from '../../lib/config';

export default class ConfigPath extends NotraCommand {
  static override description = 'Print the path of the local CLI config file.';
  static override examples = ['<%= config.bin %> config path'];

  public async run(): Promise<void> {
    const p = getConfigPath();
    if (this.emitJson()) this.printJson({ path: p });
    else this.log(p);
  }
}
