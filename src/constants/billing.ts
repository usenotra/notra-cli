/**
 * OpenAPI operations that spend AI credits. Generic `api` commands must enforce
 * the same explicit confirmation as the curated `geo` commands for these.
 */
export const BILLABLE_OPERATION_IDS: ReadonlySet<string> = new Set([
  'createGeoScan',
  'planGeoContentBrief',
  'runGeoSequence',
]);
