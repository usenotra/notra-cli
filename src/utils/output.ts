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
    table.push(opts.columns.map((c) => sanitizeTerminalText(c.get(row))));
  }
  return table.toString();
}

export function renderKv(rows: ReadonlyArray<KeyValueRow>): string {
  const widest = rows.reduce((max, [k]) => Math.max(max, k.length), 0);
  return rows
    .map(([k, v]) => {
      const label = `${k}:`.padEnd(widest + 2, ' ');
      const value = sanitizeTerminalText(v);
      return shouldUseColor() ? `${chalk.cyan(label)}${value}` : `${label}${value}`;
    })
    .join('\n');
}

export function truncate(s: string | null | undefined, max: number): string {
  if (!s) return '';
  const safe = sanitizeTerminalText(s);
  if (safe.length <= max) return safe;
  return `${safe.slice(0, Math.max(0, max - 1))}…`;
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

export function sanitizeTerminalText(value: unknown): string {
  return String(value)
    .replace(/\u001b\][\s\S]*?(?:\u0007|\u001b\\)/g, '')
    .replace(/\u001b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '');
}
