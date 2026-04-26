import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { confirmDestructive } from '../../utils/confirm';

export default class BrandsDelete extends NotraCommand {
  static override description = 'Delete a non-default brand identity.';
  static override examples = ['<%= config.bin %> brands delete brand_abc --yes'];

  static override args = {
    brandIdentityId: Args.string({ description: 'Brand identity ID.', required: true }),
  };

  static override flags = {
    yes: Flags.boolean({ description: 'Skip the interactive confirmation.', char: 'y' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(BrandsDelete);
    const ok = await confirmDestructive(`Delete brand identity ${args.brandIdentityId}?`, {
      yes: flags.yes,
    });
    if (!ok) this.error('Aborted.', { exit: 1 });

    const response = await this.client().content.deleteBrandIdentity({
      brandIdentityId: args.brandIdentityId,
    });
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.printSuccess(`Deleted brand identity ${response.id}.`);
    if (response.disabledSchedules.length > 0) {
      this.log(
        `Disabled ${response.disabledSchedules.length} schedule(s) that referenced it.`,
      );
    }
    if (response.disabledEvents.length > 0) {
      this.log(`Disabled ${response.disabledEvents.length} event trigger(s).`);
    }
  }
}
