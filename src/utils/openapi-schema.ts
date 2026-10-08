import type { JSONSchema } from 'zod/v4/core';
import { isRecord } from './records';

export function resolveOpenApiSchema(
  value: unknown,
  document: Record<string, unknown>,
  references: ReadonlyArray<string> = [],
): JSONSchema.JSONSchema {
  if (!isRecord(value)) return {};
  if (typeof value.$ref === 'string') {
    const ref = value.$ref;
    if (!ref.startsWith('#/') || references.includes(ref)) {
      throw new Error(`Unsupported OpenAPI reference: ${ref}`);
    }
    let target: unknown = document;
    for (const segment of ref.slice(2).split('/')) {
      target = isRecord(target) ? target[segment.replaceAll('~1', '/').replaceAll('~0', '~')] : undefined;
    }
    if (target === undefined) throw new Error(`Missing OpenAPI reference: ${ref}`);
    return resolveOpenApiSchema(target, document, [...references, ref]);
  }
  const result: Record<string, unknown> = { ...value };
  // Some API schemas serialize a RegExp flag after the end anchor. That is not
  // a JSON Schema regex; retaining it makes even valid lowercase slugs fail.
  if (typeof result.pattern === 'string' && result.pattern.endsWith('$/i')) {
    result.pattern = result.pattern.slice(0, -2);
  }
  for (const key of ['example', 'examples', 'title']) delete result[key];
  if (isRecord(value.properties)) {
    result.properties = Object.fromEntries(Object.entries(value.properties).map(([key, schema]) =>
      [key, resolveOpenApiSchema(schema, document, references)],
    ));
  }
  for (const key of ['items', 'additionalProperties']) {
    if (isRecord(value[key])) result[key] = resolveOpenApiSchema(value[key], document, references);
  }
  for (const key of ['oneOf', 'anyOf', 'allOf']) {
    if (Array.isArray(value[key])) result[key] = value[key].map((schema) => resolveOpenApiSchema(schema, document, references));
  }
  // OpenAPI 3.0 uses nullable; JSON Schema (and OpenAPI 3.1) uses a null union.
  if (result.nullable === true) {
    delete result.nullable;
    return { anyOf: [result, { type: 'null' }] };
  }
  if (Array.isArray(result.type)) {
    const types = result.type;
    delete result.type;
    return { anyOf: types.map((type) => ({ ...result, type })) };
  }
  return result;
}
