import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import type { UpdateBrandIdentityRequest } from '../../types/api';

const TONE_PROFILES = ['Conversational', 'Professional', 'Casual', 'Formal'] as const;

export default class BrandsUpdate extends NotraCommand {
  static override description = 'Update a brand identity.';
  static override examples = [
    '<%= config.bin %> brands update brand_abc --name "Acme Inc"',
    '<%= config.bin %> brands update brand_abc --default',
    '<%= config.bin %> brands update brand_abc --tone Professional',
  ];

  static override args = {
    brandIdentityId: Args.string({ description: 'Brand identity ID.', required: true }),
  };

  static override flags = {
    name: Flags.string({ description: 'New name.' }),
    'website-url': Flags.string({ description: 'New website URL.' }),
    'company-name': Flags.string({ description: 'Company name. Pass empty string to clear.' }),
    'company-description': Flags.string({
      description: 'Company description. Pass empty string to clear.',
    }),
    tone: Flags.string({ description: 'Tone profile.', options: [...TONE_PROFILES] }),
    'custom-tone': Flags.string({ description: 'Custom tone override.' }),
    'custom-instructions': Flags.string({ description: 'Custom instructions.' }),
    audience: Flags.string({ description: 'Target audience.' }),
    language: Flags.string({ description: 'Output language.' }),
    default: Flags.boolean({ description: 'Set as the organization default.' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(BrandsUpdate);

    const body: UpdateBrandIdentityRequest['body'] = {};
    if (flags.name !== undefined) body.name = flags.name;
    if (flags['website-url'] !== undefined) body.websiteUrl = flags['website-url'];
    if (flags['company-name'] !== undefined) {
      body.companyName = flags['company-name'] === '' ? null : flags['company-name'];
    }
    if (flags['company-description'] !== undefined) {
      body.companyDescription =
        flags['company-description'] === '' ? null : flags['company-description'];
    }
    if (flags.tone) body.toneProfile = flags.tone as (typeof TONE_PROFILES)[number];
    if (flags['custom-tone'] !== undefined) {
      body.customTone = flags['custom-tone'] === '' ? null : flags['custom-tone'];
    }
    if (flags['custom-instructions'] !== undefined) {
      body.customInstructions =
        flags['custom-instructions'] === '' ? null : flags['custom-instructions'];
    }
    if (flags.audience !== undefined) {
      body.audience = flags.audience === '' ? null : flags.audience;
    }
    if (flags.language) {
      body.language = flags.language as UpdateBrandIdentityRequest['body']['language'];
    }
    if (flags.default) body.isDefault = true;

    if (Object.keys(body).length === 0) {
      this.error('Provide at least one field to update.', { exit: 2 });
    }

    const response = await this.client().content.updateBrandIdentity({
      brandIdentityId: args.brandIdentityId,
      body,
    });

    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.printSuccess(`Updated brand identity ${response.brandIdentity.id}.`);
  }
}
