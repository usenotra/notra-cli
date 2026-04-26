import { Flags } from '@oclif/core';
import { input, password } from '@inquirer/prompts';
import { NotraCommand } from '../base-command';
import { getConfigPath, setConfigValue } from '../lib/config';
import { DEFAULT_BASE_URL } from '../types/config';

export default class Init extends NotraCommand {
  static override description = 'Configure the CLI with your Notra API key.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --api-key sk_live_xxx',
  ];

  static override flags = {
    'api-key': Flags.string({
      description: 'Notra API key. Prompts interactively if omitted.',
    }),
    'base-url': Flags.string({
      description: 'Override the API base URL.',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    const apiKey =
      flags['api-key'] ??
      (await password({
        message: 'Notra API key:',
        mask: '*',
        validate: (v) => (v.length > 0 ? true : 'API key is required.'),
      }));
    setConfigValue('api-key', apiKey);

    const baseUrlInput =
      flags['base-url'] ??
      (await input({
        message: `Base URL (press enter for ${DEFAULT_BASE_URL}):`,
        default: DEFAULT_BASE_URL,
      }));
    if (baseUrlInput && baseUrlInput !== DEFAULT_BASE_URL) {
      setConfigValue('base-url', baseUrlInput);
    }

    this.printSuccess(`Saved configuration to ${getConfigPath()}`);
  }
}
