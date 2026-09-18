import { describe, expect, test } from 'bun:test';
import { OPENAPI_OPERATIONS } from './openapi';

describe('OpenAPI catalog', () => {
  test('contains unique, callable operations', () => {
    expect(OPENAPI_OPERATIONS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(OPENAPI_OPERATIONS.map((operation) => operation.id)).size).toBe(
      OPENAPI_OPERATIONS.length,
    );
    expect(OPENAPI_OPERATIONS.find((operation) => operation.id === 'getPublicApiStatus')).toEqual(
      expect.objectContaining({ method: 'GET', path: '/v1/status' }),
    );
  });
});
