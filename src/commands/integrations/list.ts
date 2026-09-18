import { NotraCommand } from '../../base-command';
import { renderTable } from '../../utils/output';
import type { IntegrationListData, IntegrationListRow } from '../../types/integrations';

export default class IntegrationsList extends NotraCommand {
  static override description = 'List GitHub, Linear, and Slack integrations.';
  static override examples = ['<%= config.bin %> integrations list'];

  public async run(): Promise<void> {
    await this.parse(IntegrationsList);

    const response = await this.client().content.listIntegrations();
    const rows = toRows(response);
    if (this.emitJson()) {
      this.printJson(response);
      return;
    }

    this.log(
      renderTable<IntegrationListRow>(rows, {
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

function toRows(response: IntegrationListData): IntegrationListRow[] {
  const rows: IntegrationListRow[] = [];
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
    const id = typeof s === 'object' && s !== null && 'id' in s ? String(s.id) : '—';
    const display =
      typeof s === 'object' && s !== null && 'displayName' in s
        ? String(s.displayName)
        : '—';
    rows.push({ id, type: 'slack', display, detail: '—' });
  }
  return rows;
}
