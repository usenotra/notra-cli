import { describe, expect, test } from 'bun:test';
import { BILLABLE_OPERATION_IDS } from '../constants/billing';
import { OPENAPI_OPERATIONS } from '../constants/openapi';
import { isBillableRequest } from './billing';

describe('isBillableRequest', () => {
  test('every billable operation ID exists in the OpenAPI catalog', () => {
    const known: Set<string> = new Set(OPENAPI_OPERATIONS.map((operation) => operation.id));
    for (const id of BILLABLE_OPERATION_IDS) {
      expect(known.has(id)).toBe(true);
    }
  });

  test('matches billable GEO endpoints with concrete path parameters', () => {
    expect(isBillableRequest('POST', '/v1/projects/proj_123/geo/scans')).toBe(true);
    expect(isBillableRequest('POST', '/v1/projects/proj_123/geo/briefs')).toBe(true);
    expect(isBillableRequest('POST', '/v1/projects/proj_123/geo/sequences/seq_1/run')).toBe(true);
  });

  test('ignores other methods and paths on the same resources', () => {
    expect(isBillableRequest('GET', '/v1/projects/proj_123/geo/scans')).toBe(false);
    expect(isBillableRequest('POST', '/v1/projects/proj_123/geo/sequences/seq_1')).toBe(false);
    expect(isBillableRequest('GET', '/v1/status')).toBe(false);
  });

  test('tolerates a query string on the raw path', () => {
    expect(isBillableRequest('POST', '/v1/projects/proj_123/geo/scans?wait=true')).toBe(true);
  });
});
