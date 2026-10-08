import { createHash, randomBytes } from 'node:crypto';
import { Flags } from '@oclif/core';
import chalk from 'chalk';
import ora from 'ora';
import { NotraCommand } from '../../base-command';
import { MILLISECONDS_PER_SECOND, OAUTH_LOGIN_TIMEOUT_MS } from '../../constants/auth';
import { clearConfigValue, getConfigValue, getOAuthRedirectUri, getStoredAuth } from '../../lib/config';
import {
  exchangeAuthorizationCode,
  getAuthorizationUrl,
  getWorkosClientId,
  getOAuthIssuer,
  persistAuthentication,
} from '../../lib/workos';
import { openInBrowser } from '../../utils/browser';
import { startOAuthCallback } from '../../utils/oauth-callback';
import { withAuthLock } from '../../utils/auth-lock';

export default class AuthLogin extends NotraCommand {
  static override description =
    'Sign in to Notra in your browser using OAuth with PKCE.';
  static override examples = [
    '<%= config.bin %> auth login',
    '<%= config.bin %> auth login --no-browser',
  ];

  static override flags = {
    'no-browser': Flags.boolean({
      description: 'Print the URL instead of opening it automatically.',
    }),
  };

  protected override requiresFreshAccessToken = false;

  protected override usesNdjson = true;

  public async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);

    const issuer = getOAuthIssuer();
    const state = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    const callback = await startOAuthCallback(state, getOAuthRedirectUri(issuer));
    const useSpinner = !this.emitJson() && Boolean(process.stderr.isTTY);
    let spinner: ReturnType<typeof ora> | undefined;
    try {
      const clientId = await getWorkosClientId(callback.redirectUri);
      const authorizationUrl = getAuthorizationUrl({
        clientId,
        redirectUri: callback.redirectUri,
        state,
        nonce: randomBytes(32).toString('base64url'),
        codeChallenge: createHash('sha256').update(codeVerifier).digest('base64url'),
      });

      if (this.emitJson()) {
        this.printJson({
          status: 'pending',
          flow: 'authorization_code',
          authorizationUrl,
          expiresIn: OAUTH_LOGIN_TIMEOUT_MS / MILLISECONDS_PER_SECOND,
        });
      } else {
        this.log(chalk.bold('Open this URL to authorize the CLI:'));
        this.log(`  ${chalk.cyan(authorizationUrl)}`);
        if (flags['no-browser']) {
          this.log(chalk.dim('\n--no-browser set; not opening automatically.'));
        } else if (await openInBrowser(authorizationUrl)) {
          this.log(chalk.dim('\nBrowser opened. Complete the flow there.'));
        } else {
          this.log(
            chalk.yellow('\nCould not open browser automatically — open the URL above manually.'),
          );
        }
      }

      if (useSpinner) spinner = ora({ text: 'Waiting for authorization…', stream: process.stderr }).start();
      const code = await callback.code;
      const authentication = await exchangeAuthorizationCode(clientId, code, callback.redirectUri, codeVerifier);
      spinner?.stop();

      await withAuthLock(() => {
        persistAuthentication(authentication, clientId, issuer);
        if (getConfigValue('api-key')) clearConfigValue('api-key');
      });

      if (this.emitJson()) {
        this.printJson({
          status: 'ready',
          organizationId: getStoredAuth()?.organizationId ?? null,
        });
      } else {
        const who = authentication.user?.email;
        this.printSuccess(who ? `Logged in to Notra as ${who}.` : 'Logged in to Notra.');
      }
    } finally {
      spinner?.stop();
      callback.close();
    }
  }
}
