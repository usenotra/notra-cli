import { Command, Flags, type Interfaces } from '@oclif/core';
import chalk from 'chalk';
import type { Notra } from '@usenotra/sdk';
import { buildClient } from './lib/client';
import { renderJson } from './utils/output';
import { toFriendlyError } from './utils/errors';

export type BaseFlags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof NotraCommand)['baseFlags'] & T['flags']
>;

export abstract class NotraCommand extends Command {
  static override baseFlags = {
    json: Flags.boolean({
      description: 'Print machine-readable JSON instead of a formatted table.',
    }),
    'api-key': Flags.string({
      description: 'Override the configured Notra API key.',
      env: 'NOTRA_API_KEY',
      helpGroup: 'GLOBAL',
    }),
    'base-url': Flags.string({
      description: 'Override the API base URL.',
      env: 'NOTRA_BASE_URL',
      helpGroup: 'GLOBAL',
    }),
  };

  private _client?: Notra;

  protected client(): Notra {
    if (!this._client) {
      const overrides = readGlobalArgv();
      this._client = buildClient({
        apiKey: overrides.apiKey,
        baseUrl: overrides.baseUrl,
      });
    }
    return this._client;
  }

  protected emitJson(): boolean {
    return readGlobalArgv().json || !process.stdout.isTTY;
  }

  protected printJson(data: unknown): void {
    this.log(renderJson(data));
  }

  protected printPretty(text: string): void {
    this.log(text);
  }

  protected printSuccess(message: string): void {
    if (this.emitJson()) return;
    this.log(chalk.green('✓ ') + message);
  }

  public override async catch(err: unknown): Promise<unknown> {
    const friendly = toFriendlyError(err);
    if (this.emitJson()) {
      this.log(renderJson({ error: friendly.message, detail: friendly.detail }));
    } else {
      this.logToStderr(chalk.red('✗ ') + friendly.message);
      if (friendly.detail) this.logToStderr(chalk.dim(friendly.detail));
    }
    this.exit(friendly.exitCode);
  }
}

function readGlobalArgv(): { json: boolean; apiKey?: string; baseUrl?: string } {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  return {
    json,
    apiKey: extractFlag(argv, '--api-key') ?? process.env.NOTRA_API_KEY,
    baseUrl: extractFlag(argv, '--base-url') ?? process.env.NOTRA_BASE_URL,
  };
}

function extractFlag(argv: ReadonlyArray<string>, name: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === name) return argv[i + 1];
    if (arg && arg.startsWith(`${name}=`)) return arg.slice(name.length + 1);
  }
  return undefined;
}
