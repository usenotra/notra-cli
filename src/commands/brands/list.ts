import { NotraCommand } from '../../base-command';
import type { ListBrandIdentitiesBrandIdentity } from '../../types/api';
import { formatBool, formatDate, renderTable, truncate } from '../../utils/output';

export default class BrandsList extends NotraCommand {
  static override description = 'List brand identities.';
  static override examples = ['<%= config.bin %> brands list', '<%= config.bin %> brands list --json'];

  public async run(): Promise<void> {
    const response = await this.client().content.listBrandIdentities();
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }
    this.log(
      renderTable<ListBrandIdentitiesBrandIdentity>(response.brandIdentities, {
        columns: [
          { header: 'ID', get: (b) => b.id },
          { header: 'Name', get: (b) => truncate(b.name, 30) },
          { header: 'Default', get: (b) => formatBool(b.isDefault) },
          { header: 'Website', get: (b) => truncate(b.websiteUrl, 32) },
          { header: 'Updated', get: (b) => formatDate(b.updatedAt) },
        ],
      }),
    );
  }
}
