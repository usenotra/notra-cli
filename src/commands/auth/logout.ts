import { NotraCommand } from '../../base-command';
import { clearConfigValue, getConfigValue } from '../../lib/config';

export default class AuthLogout extends NotraCommand {
  static override description = 'Remove the stored API key from local config.';
  static override examples = ['<%= config.bin %> auth logout'];

  public async run(): Promise<void> {
    const existing = getConfigValue('api-key');
    if (!existing) {
      if (this.emitJson()) {
        this.printJson({ status: 'no-op' });
      } else {
        this.log('No API key was stored.');
      }
      return;
    }
    clearConfigValue('api-key');
    if (this.emitJson()) {
      this.printJson({ status: 'cleared' });
    } else {
      this.printSuccess('Logged out. Cleared stored API key.');
    }
  }
}
