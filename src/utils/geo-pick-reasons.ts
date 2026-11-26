import chalk from 'chalk';
import { Errors } from '@oclif/core';
import { GEO_PICK_LABELS, GEO_PICK_REASON_LABELS, GEO_PICK_REASONS_SHOWN, GEO_PICK_REQUEST_LABELS, GEO_PICK_REQUESTS_MIN_ANSWERS } from '../constants/geo';
import { formatDate, renderTable, sanitizeTerminalText, shouldUseColor } from './output';
import type { GeoPickReasonEvidenceResponse, GeoPickReasonsResponse, GeoPickReasonShare, GeoPickRequestRow, GeoPickRequestsResponse } from '../types/geo-pick-reasons';
import { isRecord } from './records';

const dim = (text: string) => (shouldUseColor() ? chalk.dim(text) : text);
const bold = (text: string) => (shouldUseColor() ? chalk.bold(text) : text);

function formatReasons(reasons: ReadonlyArray<GeoPickReasonShare>): string {
  if (reasons.length === 0) return '—';
  return reasons.slice(0, GEO_PICK_REASONS_SHOWN)
    .map(({ reason, share }) => `${GEO_PICK_REASON_LABELS[reason] ?? reason} ${Math.round(share * 100)}%`)
    .join('  ');
}

/** A response missing these fields is an API problem, not "no data"; say so instead of guessing. */
function unexpectedResponse(): never {
  throw new Errors.CLIError('Unexpected API response. Run with --json to see it.');
}

function isPickReasonsResponse(value: unknown): value is GeoPickReasonsResponse {
  return isRecord(value) && typeof value.configured === 'boolean' && typeof value.pending === 'number' && Array.isArray(value.brands);
}

function isPickReasonEvidenceResponse(value: unknown): value is GeoPickReasonEvidenceResponse {
  return isRecord(value) && Array.isArray(value.evidence);
}

/**
 * All products first (every brand's picks pooled, like the a16z study), then one row per brand:
 * its picks and the reasons cited most. Per-engine detail stays in --json.
 */
export function renderPickReasons(result: unknown): string {
  if (!isPickReasonsResponse(result)) unexpectedResponse();
  const { configured, pending, answers, category, brands } = result;
  if (!configured) return dim('No GEO project found.');
  const rows = category && brands.length > 0
    ? [{ brand: 'All products', own: false, ...category }, ...brands]
    : brands;
  const table = renderTable(rows, {
    empty: dim('No answers picked a brand in this window.'),
    columns: [
      { header: 'Brand', get: (row) => (row.own ? `${row.brand} (you)` : row.brand) },
      { header: 'Picks', get: (row) => String(row.picks) },
      { header: 'Top reasons', get: (row) => formatReasons(row.reasons) },
    ],
  });
  const notes = [];
  const own = brands.find((brand) => brand.own);
  if (own && answers !== undefined && answers > 0) {
    notes.push(`AI picked ${sanitizeTerminalText(own.brand)} in ${own.picks} of ${answers} ${answers === 1 ? 'answer' : 'answers'}.`);
  }
  if (pending > 0) notes.push(`${pending} ${pending === 1 ? 'answer is' : 'answers are'} not analyzed yet.`);
  if (brands.length > 0) notes.push('Run with --json for every reason per engine, or `pick-reason-evidence` for the quotes.');
  return notes.length ? `${table}\n${dim(notes.join('\n'))}` : table;
}

/** Each answer: engine, day and pick, then the prompt and the quote below it. */
export function renderPickReasonEvidence(result: unknown): string {
  if (!isPickReasonEvidenceResponse(result)) unexpectedResponse();
  const { evidence } = result;
  if (evidence.length === 0) return dim('No answers picked this brand for this reason in the window.');
  return evidence.map((answer) => [
    `${bold(sanitizeTerminalText(answer.engine))}  ${formatDate(answer.capturedAt).slice(0, 10)}  ${GEO_PICK_LABELS[answer.pick] ?? sanitizeTerminalText(answer.pick)}`,
    `  ${sanitizeTerminalText(answer.prompt)}`,
    answer.quote ? dim(`  “${sanitizeTerminalText(answer.quote)}”`) : dim('  (no exact quote)'),
  ].join('\n')).join('\n\n');
}

function isPickRequestsResponse(value: unknown): value is GeoPickRequestsResponse {
  return isRecord(value) && typeof value.configured === 'boolean' && isRecord(value.overall) && Array.isArray(value.requests);
}

const percent = (picks: number, answers: number) => (answers > 0 ? `${Math.round((picks / answers) * 100)}%` : '—');
const picksOf = (row: GeoPickRequestRow, brand: string) => row.brands.find((entry) => entry.brand === brand)?.picks ?? 0;
const leaderOf = (row: GeoPickRequestRow) => [...row.brands].sort((a, b) => b.picks - a.picks)[0];

/**
 * One row per kind of request: your pick rate, the top competitor's and how often nobody was singled out, plus who
 * leads, marked when that differs from the usual pick. Rows below the sample floor show no rates.
 */
export function renderPickRequests(result: unknown): string {
  if (!isPickRequestsResponse(result)) unexpectedResponse();
  const { configured, overall, requests, unlabeledPrompts } = result;
  if (!configured) return dim('No GEO project found.');
  if (requests.length === 0) {
    return dim(unlabeledPrompts > 0 ? 'Prompts are being labeled. Rates show up after the next scan.' : 'No labeled answers in this window.');
  }
  const own = overall.brands.find((brand) => brand.own);
  const rival = [...overall.brands].filter((brand) => !brand.own).sort((a, b) => b.picks - a.picks)[0];
  const usual = leaderOf(overall);
  const table = renderTable(requests, {
    empty: '',
    columns: [
      { header: 'Request', get: (row) => GEO_PICK_REQUEST_LABELS[row.request] ?? sanitizeTerminalText(row.request) },
      { header: 'Answers', get: (row) => String(row.answers) },
      { header: own ? `${sanitizeTerminalText(own.brand)} (you)` : 'You', get: (row) => (row.answers < GEO_PICK_REQUESTS_MIN_ANSWERS ? '—' : percent(row.brands.find((brand) => brand.own)?.picks ?? 0, row.answers)) },
      ...(rival ? [{ header: sanitizeTerminalText(rival.brand), get: (row: GeoPickRequestRow) => (row.answers < GEO_PICK_REQUESTS_MIN_ANSWERS ? '—' : percent(picksOf(row, rival.brand), row.answers)) }] : []),
      { header: 'No single choice', get: (row) => (row.answers < GEO_PICK_REQUESTS_MIN_ANSWERS ? '—' : percent(row.noSingleChoice, row.answers)) },
      {
        header: 'Picked most',
        get: (row) => {
          if (row.answers < GEO_PICK_REQUESTS_MIN_ANSWERS) return dim('not enough answers');
          const leader = leaderOf(row);
          if (!leader || leader.picks === 0) return '—';
          const name = sanitizeTerminalText(leader.brand);
          return usual && leader.brand !== usual.brand ? `${name} (flips)` : name;
        },
      },
    ],
  });
  const notes = [];
  if (usual && usual.picks > 0) notes.push(`Overall, AI picks ${sanitizeTerminalText(usual.brand)} most: ${usual.picks} of ${overall.answers} answers.`);
  if (unlabeledPrompts > 0) notes.push(`${unlabeledPrompts} ${unlabeledPrompts === 1 ? 'prompt is' : 'prompts are'} not labeled yet.`);
  return notes.length ? `${dim(notes[0] ?? '')}\n${table}${notes.length > 1 ? `\n${dim(notes.slice(1).join('\n'))}` : ''}` : table;
}
