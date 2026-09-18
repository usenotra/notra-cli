import { describe, expect, test } from 'bun:test';
import { renderJson, renderNdjson } from './output';

describe('machine-readable output', () => {
  test('serializes undefined as valid JSON null', () => {
    expect(renderJson(undefined)).toBe('null');
    expect(renderNdjson(undefined)).toBe('null');
  });
});
