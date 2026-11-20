import { describe, expect, test } from 'bun:test';
import { BILLABLE_OPERATION_IDS } from '../constants/billing';
import { OPENAPI_OPERATIONS } from '../constants/openapi';
import { getRequestConfirmation } from './api-confirmation';

describe('getRequestConfirmation', () => {
  test('every billable operation ID exists in the OpenAPI catalog', () => {
    const known: Set<string> = new Set(OPENAPI_OPERATIONS.map((operation) => operation.id));
    for (const id of BILLABLE_OPERATION_IDS) {
      expect(known.has(id)).toBe(true);
    }
  });

  test('matches billable GEO endpoints with concrete path parameters', () => {
    expect(getRequestConfirmation('POST', '/v1/projects/proj_123/geo/scans')).toBeTruthy();
    expect(getRequestConfirmation('POST', '/v1/projects/proj_123/geo/briefs')).toBeTruthy();
    expect(getRequestConfirmation('POST', '/v1/projects/proj_123/geo/sequences/seq_1/run')).toBeTruthy();
    expect(getRequestConfirmation('POST', '/v1/projects/proj_123/geo/scans/prompts/prompt_1')).toBeTruthy();
    expect(getRequestConfirmation('POST', '/v1/schedules/schedule_1/run')).toBeTruthy();
  });

  test('ignores other methods and paths on the same resources', () => {
    expect(getRequestConfirmation('GET', '/v1/projects/proj_123/geo/scans')).toBeUndefined();
    expect(getRequestConfirmation('POST', '/v1/projects/proj_123/geo/sequences/seq_1')).toBeUndefined();
    expect(getRequestConfirmation('GET', '/v1/status')).toBeUndefined();
  });

  test('tolerates a query string on the raw path', () => {
    expect(getRequestConfirmation('POST', '/v1/projects/proj_123/geo/scans?wait=true')).toBeTruthy();
  });

  test('confirms a normalized stop path and DELETE outside the catalog', () => {
    expect(getRequestConfirmation('POST', '/v1/./autopilot/runs/run_1/stop/')).toContain('Stop this Autopilot run');
    expect(getRequestConfirmation('POST', '/v1/schedules/schedule_1/run/')).toBeTruthy();
    expect(getRequestConfirmation('DELETE', '/v2/uncataloged/resource')).toContain('DELETE');
  });
});
