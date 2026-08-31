import { NotraCommand } from '../../base-command';
import { clearConfigValue, clearStoredAuth, getConfigValue, getStoredAuth } from '../../lib/config';

export default class AuthLogout extends NotraCommand {
  static override description = 'Sign out and remove stored credentials.';
  static override examples = ['<%= config.bin %> auth logout'];

  protected override requiresFreshAccessToken = false;

  public async run(): Promise<void> {
    await this.parse(AuthLogout);

    const storedAuth = getStoredAuth();
    const legacyKey = getConfigValue('api-key');
    if (!storedAuth && !legacyKey) {
      if (this.emitJson()) {
        this.printJson({ status: 'no-op' });
      } else {
        this.log('No credentials were stored.');
      }
      return;
    }
    clearStoredAuth();
    if (legacyKey) {
      clearConfigValue('api-key');
    }
    if (this.emitJson()) {
      this.printJson({ status: 'cleared' });
    } else {
      this.printSuccess('Logged out. Cleared stored credentials.');
    }
  }
}
