import chalk from 'chalk';
import { GEO_PICK_LABELS, GEO_PICK_REASON_LABELS, GEO_PICK_REASONS_SHOWN } from '../constants/geo';
import { formatDate, renderTable, sanitizeTerminalText, shouldUseColor } from './output';
import type { GeoPickReasonEvidenceResponse, GeoPickReasonsResponse, GeoPickReasonShare } from '../types/geo-pick-reasons';

const dim = (text: string) => (shouldUseColor() ? chalk.dim(text) : text);
const bold = (text: string) => (shouldUseColor() ? chalk.bold(text) : text);

function formatReasons(reasons: ReadonlyArray<GeoPickReasonShare>): string {
  if (reasons.length === 0) return '—';
  return reasons.slice(0, GEO_PICK_REASONS_SHOWN)
    .map(({ reason, share }) => `${GEO_PICK_REASON_LABELS[reason] ?? reason} ${Math.round(share * 100)}%`)
    .join('  ');
}

/** One row per brand: its picks and the reasons cited most. Per-engine detail stays in --json. */
export function renderPickReasons(result: unknown): string {
  const { configured, pending, brands } = result as GeoPickReasonsResponse;
  if (!configured) return dim('No GEO project found.');
  const table = renderTable(brands, {
    empty: dim('No answers picked a brand in this window.'),
    columns: [
      { header: 'Brand', get: (row) => (row.own ? `${row.brand} (you)` : row.brand) },
      { header: 'Picks', get: (row) => String(row.picks) },
      { header: 'Top reasons', get: (row) => formatReasons(row.reasons) },
    ],
  });
  const notes = [];
  if (pending > 0) notes.push(`${pending} ${pending === 1 ? 'answer is' : 'answers are'} not analyzed yet.`);
  if (brands.length > 0) notes.push('Run with --json for every reason per engine, or `pick-reason-evidence` for the quotes.');
  return notes.length ? `${table}\n${dim(notes.join('\n'))}` : table;
}

/** Each answer: engine, day and pick, then the prompt and the quote below it. */
export function renderPickReasonEvidence(result: unknown): string {
  const { evidence } = result as GeoPickReasonEvidenceResponse;
  if (evidence.length === 0) return dim('No answers picked this brand for this reason in the window.');
  return evidence.map((answer) => [
    `${bold(sanitizeTerminalText(answer.engine))}  ${formatDate(answer.capturedAt).slice(0, 10)}  ${GEO_PICK_LABELS[answer.pick] ?? sanitizeTerminalText(answer.pick)}`,
    `  ${sanitizeTerminalText(answer.prompt)}`,
    answer.quote ? dim(`  “${sanitizeTerminalText(answer.quote)}”`) : dim('  (no exact quote)'),
  ].join('\n')).join('\n\n');
}
