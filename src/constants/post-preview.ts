/** A post preview build that ended without going live. */
export const STOPPED_POST_PREVIEW_STATUSES: ReadonlySet<string> = new Set([
  'failed',
  'canceled',
  'expired',
  'superseded',
  'skipped',
]);
