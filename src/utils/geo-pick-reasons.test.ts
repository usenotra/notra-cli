import { describe, expect, test } from 'bun:test';
import { renderPickReasonEvidence, renderPickReasons, renderPickRequests } from './geo-pick-reasons';

const reasons = (entries: Array<[string, number, number]>) =>
  entries.map(([reason, count, share]) => ({ reason, count, share }));

describe('pick reasons output', () => {
  test('lists each brand with its top three reasons and the pending count', () => {
    const output = renderPickReasons({
      configured: true,
      pending: 4,
      answers: 40,
      category: { picks: 22, engines: [], reasons: reasons([['features', 14, 0.636], ['price', 6, 0.273]]) },
      brands: [
        { brand: 'Acme', own: true, picks: 19, engines: [], reasons: reasons([['features', 14, 0.737], ['ease_of_use', 5, 0.263], ['price', 2, 0.105], ['support', 1, 0.053]]) },
        { brand: 'Rival', own: false, picks: 3, engines: [], reasons: [] },
      ],
    });
    expect(output).toContain('Acme (you)');
    // All products leads, like the a16z table.
    expect(output.indexOf('All products')).toBeLessThan(output.indexOf('Acme (you)'));
    expect(output).toContain('Features 64%  Price 27%');
    expect(output).toContain('AI picked Acme in 19 of 40 answers.');
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

  test('reports a malformed response instead of rendering it as empty', () => {
    expect(() => renderPickReasons({ pending: 0, brands: [] })).toThrow('Unexpected API response');
    expect(() => renderPickReasonEvidence({ organization: {} })).toThrow('Unexpected API response');
  });

  test('shows pick rates per request and marks the request that flips the usual pick', () => {
    const row = (request: string, answers: number, noSingleChoice: number, brands: Array<[string, boolean, number]>) => ({
      request,
      answers,
      noSingleChoice,
      brands: brands.map(([brand, own, picks]) => ({ brand, own, picks, rate: picks / answers })),
    });
    const output = renderPickRequests({
      configured: true,
      unlabeledPrompts: 2,
      overall: row('all', 60, 6, [['Canva', true, 38], ['Adobe', false, 20]]),
      requests: [
        row('none', 40, 4, [['Canva', true, 34], ['Adobe', false, 5]]),
        row('pro', 16, 1, [['Canva', true, 2], ['Adobe', false, 15]]),
        row('budget', 3, 1, [['Canva', true, 3]]),
      ],
    });
    expect(output).toContain('Overall, AI picks Canva most: 38 of 60 answers.');
    expect(output).toContain('Canva (you)');
    expect(output).toContain('Pro-level or heavy use');
    expect(output).toContain('94%');
    expect(output).toContain('Adobe (flips)');
    expect(output).toContain('not enough answers');
    expect(output).toContain('2 prompts are not labeled yet.');
    expect(renderPickRequests({ configured: true, unlabeledPrompts: 4, overall: row('all', 0, 0, []), requests: [] })).toBe(
      'Prompts are being labeled. Rates show up after the next scan.',
    );
    expect(() => renderPickRequests({ configured: true })).toThrow('Unexpected API response');
  });
});
