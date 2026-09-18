import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { NOTRA_API_KEY_ENV_VAR, NOTRA_BASE_URL_ENV_VAR } from './constants/config';
import { VERSION } from './constants/version';
import {
  buildClient,
  MissingApiKeyError,
  resolveBearerToken,
  type NotraClient,
} from './lib/client';
import { getBaseUrl } from './lib/config';
import { HttpClient } from './lib/http-client';
import { ensureFreshAccessToken } from './lib/workos';
import { renderJson, renderNdjson, sanitizeTerminalText } from './utils/output';
import { toFriendlyError } from './utils/errors';

export abstract class NotraCommand extends Command {
  static override baseFlags = {
    json: Flags.boolean({
      description: 'Print machine-readable JSON instead of formatted output.',
    }),
    'api-key': Flags.string({
      description: 'Override the configured Notra API key.',
      env: NOTRA_API_KEY_ENV_VAR,
      helpGroup: 'GLOBAL',
    }),
    'base-url': Flags.string({
      description: 'Override the API base URL.',
      env: NOTRA_BASE_URL_ENV_VAR,
      helpGroup: 'GLOBAL',
    }),
  };

  private _client?: NotraClient;

  private _apiClient?: HttpClient;

  protected requiresFreshAccessToken = true;

  protected usesNdjson = false;

  public override async init(): Promise<void> {
    await super.init();
    if (!this.requiresFreshAccessToken) return;
    const overrides = readGlobalArgv();
    if (overrides.apiKey) return;
    await ensureFreshAccessToken();
  }

  protected client(): NotraClient {
    if (!this._client) {
      const overrides = readGlobalArgv();
      this._client = buildClient({
        apiKey: overrides.apiKey,
        baseUrl: overrides.baseUrl,
      });
    }
    return this._client;
  }

  protected geo(): HttpClient {
    return this.authenticatedApi();
  }

  protected authenticatedApi(): HttpClient {
    if (!resolveBearerToken(readGlobalArgv())) throw new MissingApiKeyError();
    return this.api();
  }

  protected api(): HttpClient {
    if (!this._apiClient) {
      const overrides = readGlobalArgv();
      this._apiClient = new HttpClient({
        apiKey: resolveBearerToken(overrides),
        baseUrl: overrides.baseUrl ?? getBaseUrl(),
        userAgent: `notra-cli/${VERSION}`,
      });
    }
    return this._apiClient;
  }

  protected emitJson(): boolean {
    return readGlobalArgv().json || !process.stdout.isTTY;
  }

  protected printJson(data: unknown): void {
    this.log(this.usesNdjson ? renderNdjson(data) : renderJson(data));
  }

  protected printSuccess(message: string): void {
    if (this.emitJson()) return;
    this.log(chalk.green('✓ ') + message);
  }

  public override async catch(err: unknown): Promise<unknown> {
    const friendly = toFriendlyError(err);
    if (this.emitJson()) {
      this.printJson({ error: friendly.message, detail: friendly.detail });
    } else {
      this.logToStderr(chalk.red('✗ ') + sanitizeTerminalText(friendly.message));
      if (friendly.detail) this.logToStderr(chalk.dim(sanitizeTerminalText(friendly.detail)));
    }
    process.exit(friendly.exitCode);
  }
}

function readGlobalArgv(): { json: boolean; apiKey?: string; baseUrl?: string } {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  return {
    json,
    apiKey: extractFlag(argv, '--api-key') ?? process.env[NOTRA_API_KEY_ENV_VAR],
    baseUrl: extractFlag(argv, '--base-url') ?? process.env[NOTRA_BASE_URL_ENV_VAR],
  };
}

function extractFlag(argv: ReadonlyArray<string>, name: string): string | undefined {
  let found: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === name) found = argv[i + 1];
    else if (arg && arg.startsWith(`${name}=`)) found = arg.slice(name.length + 1);
  }
  return found;
}
