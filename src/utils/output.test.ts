import { describe, expect, test } from 'bun:test';
import { renderNdjson } from './output';

describe('renderNdjson', () => {
  test('renders one compact JSON object per line', () => {
    expect(renderNdjson({ status: 'pending', nested: { value: true } })).toBe(
      '{"status":"pending","nested":{"value":true}}',
    );
  });
});
