import Table from 'cli-table3';
import chalk from 'chalk';
import type { KeyValueRow, TableOptions } from '../types/output';

export function isTty(): boolean {
  return Boolean(process.stdout.isTTY);
}

export function shouldUseColor(): boolean {
  if (process.env.NO_COLOR) return false;
  return isTty();
}

export function renderJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function renderTable<T>(rows: ReadonlyArray<T>, opts: TableOptions<T>): string {
  if (rows.length === 0) return opts.empty ?? chalk.dim('(no rows)');
  const headers = opts.columns.map((c) =>
    shouldUseColor() ? chalk.bold(c.header) : c.header,
  );
  const table = new Table({
    head: headers,
    style: { head: [], border: shouldUseColor() ? ['gray'] : [] },
  });
  for (const row of rows) {
    table.push(opts.columns.map((c) => c.get(row)));
  }
  return table.toString();
}

export function renderKv(rows: ReadonlyArray<KeyValueRow>): string {
  const widest = rows.reduce((max, [k]) => Math.max(max, k.length), 0);
  return rows
    .map(([k, v]) => {
      const label = `${k}:`.padEnd(widest + 2, ' ');
      return shouldUseColor() ? `${chalk.cyan(label)}${v}` : `${label}${v}`;
    })
    .join('\n');
}

export function truncate(s: string | null | undefined, max: number): string {
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').replace(/\..+/, '');
}

export function formatBool(v: boolean): string {
  return v ? 'yes' : 'no';
}
