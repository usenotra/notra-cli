import { Args } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { CONFIG_KEYS } from '../../constants/config';
import { setConfigValue } from '../../lib/config';
import type { ConfigKey } from '../../types/config';

export default class ConfigSet extends NotraCommand {
  static override description = 'Set a CLI configuration value.';
  static override examples = [
    '<%= config.bin %> config set api-key sk_live_xxx',
    '<%= config.bin %> config set base-url https://api.usenotra.com',
  ];

  static override args = {
    key: Args.string({
      description: 'Configuration key.',
      required: true,
      options: [...CONFIG_KEYS],
    }),
    value: Args.string({ description: 'Value to store.', required: true }),
  };

  protected override requiresFreshAccessToken = false;

  public async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    setConfigValue(args.key as ConfigKey, args.value);
    if (this.emitJson()) {
      this.printJson({ status: 'set', key: args.key });
      return;
    }
    this.printSuccess(`Set ${args.key}.`);
  }
}
