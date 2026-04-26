import { NotraCommand } from '../../base-command';
import { renderTable } from '../../utils/output';

type Row = {
  id: string;
  type: 'github' | 'slack' | 'linear';
  display: string;
  detail: string;
};

export default class IntegrationsList extends NotraCommand {
  static override description = 'List GitHub, Linear, and Slack integrations.';
  static override examples = ['<%= config.bin %> integrations list'];

  public async run(): Promise<void> {
    const response = await this.client().content.listIntegrations();
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }

    const rows: Row[] = [];
    for (const g of response.github) {
      rows.push({
        id: g.id,
        type: 'github',
        display: g.displayName,
        detail: g.owner && g.repo ? `${g.owner}/${g.repo}` : '—',
      });
    }
    for (const l of response.linear) {
      rows.push({
        id: l.id,
        type: 'linear',
        display: l.displayName,
        detail: l.linearTeamName ?? l.linearOrganizationName ?? '—',
      });
    }
    for (const s of response.slack) {
      const id = typeof s === 'object' && s !== null && 'id' in s ? String((s as { id: unknown }).id) : '—';
      const display =
        typeof s === 'object' && s !== null && 'displayName' in s
          ? String((s as { displayName: unknown }).displayName)
          : '—';
      rows.push({ id, type: 'slack', display, detail: '—' });
    }

    this.log(
      renderTable<Row>(rows, {
        columns: [
          { header: 'ID', get: (r) => r.id },
          { header: 'Type', get: (r) => r.type },
          { header: 'Name', get: (r) => r.display },
          { header: 'Detail', get: (r) => r.detail },
        ],
        empty: 'No integrations connected.',
      }),
    );
  }
}
