import { Flags } from '@oclif/core';
import chalk from 'chalk';
import ora from 'ora';
import { NotraCommand } from '../../base-command';
import { MILLISECONDS_PER_SECOND } from '../../constants/auth';
import { clearConfigValue, getConfigValue } from '../../lib/config';
import {
  DeviceAuthorizationError,
  getWorkosClientId,
  nextPollIntervalMs,
  persistAuthentication,
  pollDeviceAuthorization,
  requestDeviceAuthorization,
  slowedDownIntervalSeconds,
} from '../../lib/workos';
import type { AuthenticationResponse, DeviceAuthorizationResponse } from '../../types/workos';
import { openInBrowser } from '../../utils/browser';
import { ExitCode } from '../../utils/exit';

export default class AuthLogin extends NotraCommand {
  static override description =
    'Sign in to Notra by authorizing this device in your browser.';
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

  public async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);

    const clientId = getWorkosClientId();
    const deviceAuth = await requestDeviceAuthorization(clientId);

    if (this.emitJson()) {
      this.printJson({
        status: 'pending',
        userCode: deviceAuth.user_code,
        verificationUri: deviceAuth.verification_uri,
        verificationUriComplete: deviceAuth.verification_uri_complete,
        expiresIn: deviceAuth.expires_in,
      });
    } else {
      this.log(chalk.bold('Open this URL to authorize the CLI:'));
      this.log(`  ${chalk.cyan(deviceAuth.verification_uri_complete)}`);
      this.log(chalk.bold('\nVerification code:'));
      this.log(`  ${chalk.cyan(deviceAuth.user_code)}`);
      this.log(chalk.dim('Only approve this code if it matches the one in your browser.'));
      if (flags['no-browser']) {
        this.log(chalk.dim('\n--no-browser set; not opening automatically.'));
      } else if (openInBrowser(deviceAuth.verification_uri_complete)) {
        this.log(chalk.dim('\nBrowser opened. Complete the flow there.'));
      } else {
        this.log(
          chalk.yellow('\nCould not open browser automatically — open the URL above manually.'),
        );
      }
    }

    const authentication = await this.pollForTokens(clientId, deviceAuth);

    persistAuthentication(authentication);
    if (getConfigValue('api-key')) {
      clearConfigValue('api-key');
    }

    if (this.emitJson()) {
      this.printJson({
        status: 'ready',
        organizationId: authentication.organization_id ?? null,
      });
    } else {
      const who = authentication.user?.email;
      this.printSuccess(who ? `Logged in to Notra as ${who}.` : 'Logged in to Notra.');
    }
  }

  private async pollForTokens(
    clientId: string,
    deviceAuth: DeviceAuthorizationResponse,
  ): Promise<AuthenticationResponse> {
    const useSpinner = !this.emitJson() && Boolean(process.stderr.isTTY);
    const spinner = useSpinner
      ? ora({ text: 'Waiting for authorization…', stream: process.stderr }).start()
      : undefined;

    const deadline = Date.now() + deviceAuth.expires_in * MILLISECONDS_PER_SECOND;
    let intervalSeconds = deviceAuth.interval;

    try {
      while (Date.now() < deadline) {
        await sleep(nextPollIntervalMs(intervalSeconds));
        const result = await pollDeviceAuthorization(clientId, deviceAuth.device_code);
        if (result.status === 'success') {
          spinner?.stop();
          return result.authentication;
        }
        if (result.status === 'slow_down') {
          intervalSeconds = slowedDownIntervalSeconds(intervalSeconds);
        }
      }

      spinner?.fail('Timed out waiting for authorization.');
      this.error('Timed out waiting for authorization. Run `notra auth login` again.', {
        exit: ExitCode.Network,
      });
    } catch (err) {
      if (err instanceof DeviceAuthorizationError) {
        if (err.code === 'access_denied') {
          spinner?.fail('Authorization denied.');
          this.error('Authorization was denied in the browser.', { exit: ExitCode.Auth });
        }
        if (err.code === 'expired_token') {
          spinner?.fail('Code expired.');
          this.error('The verification code expired. Run `notra auth login` again.', {
            exit: ExitCode.Auth,
          });
        }
      }
      spinner?.stop();
      throw err;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
