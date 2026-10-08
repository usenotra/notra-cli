import { describe, expect, test } from 'bun:test';
import { OPENAPI_OPERATIONS, OPENAPI_REQUEST_SCHEMAS } from '../constants/openapi';
import { buildOpenApiCatalog } from './openapi-catalog';

describe('OpenAPI catalog generation', () => {
  test('operation metadata and request schemas form one complete snapshot', () => {
    expect(Object.keys(OPENAPI_REQUEST_SCHEMAS).sort()).toEqual(OPENAPI_OPERATIONS.map(({ id }) => id).sort());
    for (const operation of OPENAPI_OPERATIONS) {
      for (const parameter of operation.parameters) {
        expect(OPENAPI_REQUEST_SCHEMAS[operation.id]?.parameters[parameter.name]).toBeDefined();
      }
    }
  });

  test('resolves request schemas while preserving metadata and parameter locations', () => {
    const result = buildOpenApiCatalog({
      components: { schemas: { Input: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } } },
      paths: { '/items/{id}': {
        post: {
          operationId: 'createItem', summary: 'Create an item', tags: ['Items'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1 } },
            { name: 'X-Trace', in: 'header', schema: { type: 'string' } },
          ],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Input' } } } },
        },
        get: { operationId: 'getItem' },
        options: { operationId: 'ignored' },
      } },
    });
    expect(result.operations.map(({ id }) => id)).toEqual(['createItem', 'getItem']);
    expect(result.operations[0]).toMatchObject({ method: 'POST', path: '/items/{id}', summary: 'Create an item', tag: 'Items', hasBody: true });
    expect(result.requests.createItem).toEqual({
      parameters: { id: { type: 'string' }, limit: { type: 'integer', minimum: 1 }, 'X-Trace': { type: 'string' } },
      body: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] },
    });
  });

  test('rejects invalid input and duplicate operation IDs instead of producing a mismatched catalog', () => {
    expect(() => buildOpenApiCatalog(null)).toThrow('paths object');
    expect(() => buildOpenApiCatalog({ paths: {
      '/a': { get: { operationId: 'same' } }, '/b': { post: { operationId: 'same' } },
    } })).toThrow('Duplicate OpenAPI operation ID: same');
    expect(() => buildOpenApiCatalog({ paths: {
      '/a': { post: { operationId: 'broken', requestBody: { content: { 'application/json': { schema: { $ref: '#/missing' } } } } } },
    } })).toThrow('Missing OpenAPI reference');
  });
});
