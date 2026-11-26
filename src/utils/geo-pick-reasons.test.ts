import { describe, expect, test } from 'bun:test';
import { renderPickReasonEvidence, renderPickReasons } from './geo-pick-reasons';

const reasons = (entries: Array<[string, number, number]>) =>
  entries.map(([reason, count, share]) => ({ reason, count, share }));

describe('pick reasons output', () => {
  test('lists each brand with its top three reasons and the pending count', () => {
    const output = renderPickReasons({
      configured: true,
      pending: 4,
      brands: [
        { brand: 'Acme', own: true, picks: 19, engines: [], reasons: reasons([['features', 14, 0.737], ['ease_of_use', 5, 0.263], ['price', 2, 0.105], ['support', 1, 0.053]]) },
        { brand: 'Rival', own: false, picks: 3, engines: [], reasons: [] },
      ],
    });
    expect(output).toContain('Acme (you)');
    expect(output).toContain('Features 74%  Easy to use 26%  Price 11%');
    expect(output).not.toContain('Support');
    expect(output).toContain('4 answers are not analyzed yet.');
  });

  test('says so when nothing was picked or no project matched', () => {
    expect(renderPickReasons({ configured: true, pending: 0, brands: [] })).toBe('No answers picked a brand in this window.');
    expect(renderPickReasons({ configured: false, pending: 0, brands: [] })).toBe('No GEO project found.');
  });

  test('shows engine, day, pick, prompt and quote for each answer', () => {
    const output = renderPickReasonEvidence({
      evidence: [{
        checkId: 'check_1', promptId: 'prompt_1', prompt: 'Best changelog tool?',
        engine: 'anthropic/claude-sonnet-5', capturedAt: '2026-11-20T09:30:00.000Z',
        pick: 'top_pick', quote: '',
      }],
    });
    expect(output).toBe('anthropic/claude-sonnet-5  2026-11-20  Top pick\n  Best changelog tool?\n  (no exact quote)');
  });
});
