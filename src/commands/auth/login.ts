import { randomBytes } from 'node:crypto';
import { Flags } from '@oclif/core';
import chalk from 'chalk';
import ora from 'ora';
import { NotraCommand } from '../../base-command';
import { getDashboardUrl, setConfigValue } from '../../lib/config';
import { openInBrowser } from '../../utils/browser';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export default class AuthLogin extends NotraCommand {
  static override description =
    'Authenticate the CLI by creating an API key in the dashboard.';
  static override examples = [
    '<%= config.bin %> auth login',
    '<%= config.bin %> auth login --dashboard-url https://app.usenotra.com',
    '<%= config.bin %> auth login --no-browser',
  ];

  static override flags = {
    'dashboard-url': Flags.string({
      description: 'Override the dashboard URL used for the auth handshake.',
      env: 'NOTRA_DASHBOARD_URL',
    }),
    'no-browser': Flags.boolean({
      description: 'Print the URL instead of opening it automatically.',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);

    const dashboardUrl = (flags['dashboard-url'] ?? getDashboardUrl()).replace(
      /\/+$/,
      '',
    );
    const sessionId = randomBytes(32).toString('base64url');
    const authUrl = `${dashboardUrl}/dashboard?cli_session=${sessionId}`;

    if (this.emitJson()) {
      this.printJson({ status: 'pending', sessionId, authUrl });
    } else {
      this.log(chalk.bold('Open this URL to authorize the CLI:'));
      this.log(`  ${chalk.cyan(authUrl)}`);
      if (flags['no-browser']) {
        this.log(chalk.dim('\n--no-browser set; not opening automatically.'));
      } else if (openInBrowser(authUrl)) {
        this.log(chalk.dim('\nBrowser opened. Complete the flow there.'));
      } else {
        this.log(
          chalk.yellow('\nCould not open browser automatically — open the URL above manually.'),
        );
      }
    }

    const apiKey = await this.pollForKey(dashboardUrl, sessionId);

    setConfigValue('api-key', apiKey);
    if (flags['dashboard-url']) {
      setConfigValue('dashboard-url', dashboardUrl);
    }

    if (this.emitJson()) {
      this.printJson({ status: 'ready' });
    } else {
      this.printSuccess('Logged in to Notra. Run `notra config get api-key` to view the full key.');
    }
  }

  private async pollForKey(dashboardUrl: string, sessionId: string): Promise<string> {
    const url = `${dashboardUrl}/api/cli/sessions/${encodeURIComponent(sessionId)}`;
    const useSpinner = !this.emitJson() && Boolean(process.stderr.isTTY);
    const spinner = useSpinner
      ? ora({ text: 'Waiting for authorization…', stream: process.stderr }).start()
      : undefined;

    const start = Date.now();
    try {
      while (Date.now() - start < POLL_TIMEOUT_MS) {
        const res = await fetch(url, { headers: { accept: 'application/json' } });

        if (res.status === 200) {
          const body = (await res.json()) as { status: string; apiKey?: string };
          if (body.status === 'ready' && body.apiKey) {
            spinner?.stop();
            return body.apiKey;
          }
        } else if (res.status === 410) {
          spinner?.fail('Session expired.');
          this.error('Session expired before you authorized. Run `notra auth login` again.', {
            exit: 3,
          });
        } else if (res.status === 202) {
          // pending
        } else if (res.status >= 400) {
          spinner?.fail(`Unexpected response (HTTP ${res.status}).`);
          this.error(`Auth flow failed: HTTP ${res.status}`, { exit: 1 });
        }

        await sleep(POLL_INTERVAL_MS);
      }

      spinner?.fail('Timed out waiting for authorization.');
      this.error('Timed out waiting for authorization. Run `notra auth login` again.', {
        exit: 1,
      });
    } catch (err) {
      spinner?.stop();
      throw err;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
