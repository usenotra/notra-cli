import { Args } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { CONFIG_KEYS } from '../../constants/config';
import { getAllConfig, getConfigValue } from '../../lib/config';
import type { ConfigKey, ConfigSchema } from '../../types/config';
import { renderKv } from '../../utils/output';

export default class ConfigGet extends NotraCommand {
  static override description = 'Read a configuration value, or print all when no key is given.';
  static override examples = [
    '<%= config.bin %> config get',
    '<%= config.bin %> config get api-key',
  ];

  static override args = {
    key: Args.string({
      description: 'Specific key to read.',
      required: false,
      options: [...CONFIG_KEYS],
    }),
  };

  protected override requiresFreshAccessToken = false;

  public async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);

    if (args.key) {
      const value = getConfigValue(args.key as ConfigKey);
      if (this.emitJson()) {
        this.printJson({ [args.key]: value ?? null });
      } else {
        this.log(value ?? '');
      }
      return;
    }

    const all = getAllConfig();
    const redacted = redact(all);
    if (this.emitJson()) {
      this.printJson(redacted);
      return;
    }
    this.log(
      renderKv([
        ['api-key', redacted.apiKey ?? '(unset)'],
        ['base-url', redacted.baseUrl ?? '(default)'],
        ['organization-id', redacted.organizationId ?? '(unset)'],
        ['session', all.refreshToken ? 'signed in' : '(signed out)'],
      ]),
    );
  }
}

function redact(config: ConfigSchema): ConfigSchema {
  return {
    ...config,
    apiKey: mask(config.apiKey),
    accessToken: mask(config.accessToken),
    refreshToken: mask(config.refreshToken),
  };
}

function mask(key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return '*'.repeat(key.length);
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
