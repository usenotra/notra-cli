import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { ExitCode } from '../../constants/exit';
import { confirmDestructive } from '../../utils/confirm';

export default class IntegrationsRemove extends NotraCommand {
  static override description = 'Disconnect a GitHub or Linear integration.';
  static override examples = ['<%= config.bin %> integrations remove integration_abc --yes'];

  static override args = {
    integrationId: Args.string({ description: 'Integration ID.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ description: 'Skip the interactive confirmation.', char: 'y' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(IntegrationsRemove);
    const ok = await confirmDestructive(`Disconnect integration ${args.integrationId}?`, {
      yes: flags.yes,
    });
    if (!ok) this.error('Aborted.', { exit: ExitCode.Generic });

    const response = await this.client().content.deleteIntegration({
      integrationId: args.integrationId,
    });
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.printSuccess(`Removed integration ${response.id}.`);
    if (response.disabledSchedules.length > 0) {
      this.log(`Disabled ${response.disabledSchedules.length} schedule(s) that referenced it.`);
    }
    if (response.disabledEvents.length > 0) {
      this.log(`Disabled ${response.disabledEvents.length} event trigger(s).`);
    }
  }
}
