import { NotraCommand } from '../../base-command';
import { clearConfigValue, clearStoredAuth, getConfigValue, getStoredAuth } from '../../lib/config';
import { withAuthLock } from '../../utils/auth-lock';

export default class AuthLogout extends NotraCommand {
  static override description = 'Remove locally stored credentials; does not revoke server-side access.';
  static override examples = ['<%= config.bin %> auth logout'];

  protected override requiresFreshAccessToken = false;

  public async run(): Promise<void> {
    await this.parse(AuthLogout);

    const cleared = await withAuthLock(() => {
      const storedAuth = getStoredAuth();
      const legacyKey = getConfigValue('api-key');
      if (!storedAuth && !legacyKey) return false;
      clearStoredAuth();
      if (legacyKey) clearConfigValue('api-key');
      return true;
    });
    if (this.emitJson()) {
      this.printJson({ status: cleared ? 'cleared' : 'no-op' });
    } else if (cleared) {
      this.printSuccess('Cleared local credentials. Server-side access has not been revoked.');
    } else {
      this.log('No credentials were stored.');
    }
  }
}
