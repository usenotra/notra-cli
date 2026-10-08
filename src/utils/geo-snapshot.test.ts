import { afterAll, describe, expect, test } from 'bun:test';
import { HttpClient } from '../lib/http-client';
import { loadGeoSnapshot } from './geo-snapshot';

describe('GEO snapshot', () => {
  let overviewStatus = 200;
  let empty = false;
  let malformedPath = '';
  const paths: string[] = [];
  const queries: Record<string, Record<string, string>> = {};
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.split('/geo/')[1]!;
    paths.push(path);
    queries[path] = Object.fromEntries(url.searchParams);
    if (path === malformedPath) return Response.json({ invalid: true });
    if (path === 'visibility/overview') {
      if (overviewStatus !== 200) return Response.json({ error: 'Overview failed' }, { status: overviewStatus });
      return Response.json({
        organization: { id: 'org_1', name: 'Acme', slug: 'acme', logo: null }, configured: true,
        engines: empty ? [] : [
          { engine: 'openai', checks: 10, mentions: 2, citations: 1, visibility: 1, avgPosition: 2 },
          { engine: 'anthropic', checks: 10, mentions: 4, citations: 3, visibility: 3, avgPosition: 5 },
        ],
      });
    }
    if (path === 'visibility/competitor-share') return Response.json({ points: [{ name: 'A', mentions: 2 }, { name: 'B', mentions: 7 }] });
    if (path === 'gaps') return Response.json({ hasScanData: true, promptGaps: [{ opportunity: 0.8 }], searchGaps: [{ impressions: 50 }] });
    if (path === 'agent-readiness') return Response.json({ targetUrl: 'https://example.com', scan: null, report: { status: 'completed', score: 65, scoreLabel: 'Needs work', issues: [1, 2, 3, 4, 5, 6] } });
    if (path === 'traffic/overview') return Response.json({ configured: false, totals: { visits: 5 }, sources: [{ visits: 1 }, { visits: 4 }] });
    if (path === 'sentiment') return Response.json({ summary: { negativeShare: 0.3, positiveShare: 0.7 } });
    if (path === 'changes') return Response.json({ summary: { lost: 2, citationsRemoved: 1, gained: 3 } });
    if (path === 'shelf-sources') return Response.json({ sources: [{ domain: 'example.com' }], nextOffset: 5 });
    return Response.json({ error: `Unexpected path: ${url.pathname}` }, { status: 404 });
  } });
  const client = new HttpClient({ baseUrl: server.url.href, apiKey: 'test' });
  afterAll(() => server.stop(true));

  test('aggregates all eight signals, bounds evidence and recommends actions', async () => {
    paths.length = 0;
    const result = await loadGeoSnapshot(client, 'project_1', { days: 30 });
    expect(paths).toHaveLength(8);
    expect(result.visibility).toMatchObject({ checks: 20, mentions: 6, mentionRate: 0.3, citations: 4, visibilityRate: 0.2, avgPosition: 4 });
    expect(result.competitors?.leaders[0]?.name).toBe('B');
    expect(result.agentReadiness?.topIssues).toHaveLength(5);
    expect(result.traffic?.topSources[0]?.visits).toBe(4);
    expect(result.shelf?.hasMore).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.recommendedNextActions.map((action) => action.action)).toEqual([
      'review_content_gaps', 'investigate_visibility_losses', 'prioritize_content_gaps',
      'review_negative_sentiment', 'fix_agent_readiness', 'configure_ai_traffic',
    ]);
    expect(queries['visibility/overview']).toEqual({ days: '30' });
    expect(queries['sentiment']).toEqual({ days: '30' });
    expect(queries['shelf-sources']).toEqual({ limit: '5' });
  });

  test('a single invalid optional response affects only its named section', async () => {
    malformedPath = 'agent-readiness';
    try {
      const result = await loadGeoSnapshot(client, 'project_1', { days: 30 });
      expect(result.agentReadiness).toBeNull();
      expect(result.competitors?.tracked).toBe(2);
      expect(result.sentiment?.negativeShare).toBe(0.3);
      expect(result.warnings).toEqual([{
        section: 'agentReadiness', message: 'The Notra API returned an invalid agent readiness.',
      }]);
      expect(result.recommendedNextActions.some((action) => action.action === 'fix_agent_readiness')).toBe(false);
    } finally { malformedPath = ''; }
  });

  test('empty projects do not produce NaN metrics', async () => {
    empty = true;
    try {
      const result = await loadGeoSnapshot(client, 'project_1', {});
      expect(result.visibility.mentionRate).toBe(0);
      expect(result.visibility.visibilityRate).toBe(0);
      expect(result.visibility.avgPosition).toBeNull();
      expect(result.recommendedNextActions[0]?.action).toBe('run_geo_scan');
    } finally { empty = false; }
  });

  test('required overview failures are not hidden by optional results', async () => {
    overviewStatus = 403;
    try {
      await expect(loadGeoSnapshot(client, 'project_1', {})).rejects.toMatchObject({ statusCode: 403 });
    } finally { overviewStatus = 200; }
  });
});
