import { Args } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { formatBool, formatDate, renderKv } from '../../utils/output';

export default class BrandsGet extends NotraCommand {
  static override description = 'Fetch a single brand identity by ID.';
  static override examples = ['<%= config.bin %> brands get brand_abc123'];

  static override args = {
    brandIdentityId: Args.string({ description: 'Brand identity ID.', required: true }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(BrandsGet);
    const response = await this.client().content.getBrandIdentity({
      brandIdentityId: args.brandIdentityId,
    });
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    if (!response.brandIdentity) this.error('Brand identity not found.', { exit: 5 });

    const b = response.brandIdentity;
    this.log(
      renderKv([
        ['ID', b.id],
        ['Name', b.name],
        ['Default', formatBool(b.isDefault)],
        ['Website', b.websiteUrl],
        ['Company', b.companyName ?? '—'],
        ['Tone', b.toneProfile ?? b.customTone ?? '—'],
        ['Audience', b.audience ?? '—'],
        ['Language', b.language ?? '—'],
        ['Updated', formatDate(b.updatedAt)],
      ]),
    );
  }
}
