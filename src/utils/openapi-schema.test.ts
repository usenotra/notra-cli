import { describe, expect, test } from 'bun:test';
import { fromJSONSchema } from 'zod';
import { OPENAPI_REQUEST_SCHEMAS } from '../constants/openapi';
import { resolveOpenApiSchema } from './openapi-schema';

describe('bundled OpenAPI request schemas', () => {
  test('every body and parameter schema compiles without unresolved references', () => {
    for (const spec of Object.values(OPENAPI_REQUEST_SCHEMAS)) {
      for (const schema of [...Object.values(spec.parameters), ...(spec.body ? [spec.body] : [])]) {
        expect(() => fromJSONSchema(schema)).not.toThrow();
        expect(JSON.stringify(schema)).not.toContain('"$ref"');
      }
    }
  });

  test('resolves nested references, escaped names and nullable unions', () => {
    const schema = resolveOpenApiSchema({ type: 'object', properties: { value: { $ref: '#/components/schemas/a~1b' } } }, {
      components: { schemas: { 'a/b': { type: ['string', 'null'], minLength: 2 } } },
    });
    const validator = fromJSONSchema(schema);
    expect(validator.safeParse({ value: null }).success).toBe(true);
    expect(validator.safeParse({ value: 'ok' }).success).toBe(true);
    expect(validator.safeParse({ value: 'x' }).success).toBe(false);
    expect(fromJSONSchema(resolveOpenApiSchema({ type: 'string', nullable: true }, {})).safeParse(null).success).toBe(true);
  });

  test('keeps serialized case-insensitive patterns case-insensitive', () => {
    const validator = fromJSONSchema(resolveOpenApiSchema(
      { type: 'string', pattern: '^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i' },
      {},
    ));
    expect(validator.safeParse('#13A0DC').success).toBe(true);
    expect(validator.safeParse('#13a0dc').success).toBe(true);
    expect(validator.safeParse('#13A0DG').success).toBe(false);
  });

  test('fails loudly on missing, remote and recursive references', () => {
    expect(() => resolveOpenApiSchema({ $ref: '#/missing' }, {})).toThrow('Missing OpenAPI reference');
    expect(() => resolveOpenApiSchema({ $ref: 'https://example.com/schema' }, {})).toThrow('Unsupported OpenAPI reference');
    expect(() => resolveOpenApiSchema({ $ref: '#/loop' }, { loop: { $ref: '#/loop' } })).toThrow('Unsupported OpenAPI reference');
  });
});
