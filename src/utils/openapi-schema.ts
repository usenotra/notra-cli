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
  // Some API schemas serialize a RegExp `i` flag after the end anchor. That is
  // not a JSON Schema regex and JSON Schema has no flags, so spell out both
  // letter cases instead; otherwise "#13A0DC" fails locally.
  if (typeof result.pattern === 'string' && result.pattern.endsWith('$/i')) {
    const pattern = caseInsensitivePattern(result.pattern.slice(0, -2));
    if (pattern === undefined) delete result.pattern;
    else result.pattern = pattern;
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

const ASCII_LETTER = /^[a-z]$/i;

// Returns undefined for syntax this does not rewrite safely (non-ASCII text,
// backreferences, Unicode, hex and named escapes or groups); dropping the
// pattern leaves validation to the API.
export function caseInsensitivePattern(pattern: string): string | undefined {
  if (/[^\x00-\x7f]|\\[pPkuxc1-9]|\(\?</.test(pattern)) return undefined;
  let result = '';
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]!;
    if (char === '\\') {
      result += pattern.slice(index, index + 2);
      index += 1;
      continue;
    }
    if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    if (!ASCII_LETTER.test(char)) {
      result += char;
      continue;
    }
    const other = swapCase(char);
    if (!inClass) {
      result += `[${char}${other}]`;
      continue;
    }
    const end = pattern[index + 2];
    if (pattern[index + 1] === '-' && end !== undefined && ASCII_LETTER.test(end)) {
      result += `${char}-${end}${other}-${swapCase(end)}`;
      index += 2;
      continue;
    }
    result += `${char}${other}`;
  }
  return result;
}

function swapCase(letter: string): string {
  const lower = letter.toLowerCase();
  return letter === lower ? letter.toUpperCase() : lower;
}
