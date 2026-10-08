import type { HttpClient } from '../lib/http-client';
import type { ZodType } from 'zod';
import type { GeoSnapshotSectionResult, GeoSnapshotWarning, GeoWindow } from '../types/geo';
import type { ApiRequestOptions } from '../types/http';
import { GEO_SNAPSHOT_ITEM_LIMIT, GEO_SNAPSHOT_OPTIONAL_TIMEOUT_MS } from '../constants/geo';
import {
  snapshotChangesSchema, snapshotCompetitorsSchema, snapshotGapsSchema,
  snapshotOverviewSchema, snapshotReadinessSchema, snapshotSentimentSchema,
  snapshotShelfSchema, snapshotTrafficSchema,
} from '../schemas/geo-snapshot';
import { apiResponseDecoder } from './parse-api-response';
import { recommendGeoActions } from './geo-snapshot-actions';
import {
  summarizeCompetitors, summarizeContentGaps, summarizeReadiness,
  summarizeShelf, summarizeTraffic, summarizeVisibility,
} from './geo-snapshot-sections';

export async function loadGeoSnapshot(client: HttpClient, projectId: string, window: GeoWindow) {
  const base = `/v1/projects/${encodeURIComponent(projectId)}/geo`;
  const controller = new AbortController();
  const optional = { timeoutMs: GEO_SNAPSHOT_OPTIONAL_TIMEOUT_MS, signal: controller.signal };
  async function section<Output>(
    name: GeoSnapshotWarning['section'],
    path: string,
    schema: ZodType<Output>,
    label: string,
    query?: ApiRequestOptions['query'],
  ): Promise<GeoSnapshotSectionResult<Output>> {
    try {
      const value = await client.request('GET', `${base}/${path}`, {
        ...optional, query, decode: apiResponseDecoder(schema, label),
      });
      return { value, warnings: [] };
    } catch (error) {
      return { value: null, warnings: [{ section: name, message: error instanceof Error ? error.message : String(error) }] };
    }
  }
  const overviewPromise = client.request('GET', `${base}/visibility/overview`, {
    query: window, decode: apiResponseDecoder(snapshotOverviewSchema, 'visibility overview'),
  });
  const resultsPromise = Promise.all([
    section('competitors', 'visibility/competitor-share', snapshotCompetitorsSchema.transform(summarizeCompetitors), 'competitors', window),
    section('contentGaps', 'gaps', snapshotGapsSchema.transform(summarizeContentGaps), 'content gaps'),
    section('agentReadiness', 'agent-readiness', snapshotReadinessSchema.transform(summarizeReadiness), 'agent readiness'),
    section('traffic', 'traffic/overview', snapshotTrafficSchema.transform(summarizeTraffic), 'AI traffic', window),
    section('sentiment', 'sentiment', snapshotSentimentSchema.transform((data) => data.summary), 'sentiment', window),
    section('changes', 'changes', snapshotChangesSchema.transform((data) => data.summary), 'scan changes'),
    section('shelf', 'shelf-sources', snapshotShelfSchema.transform(summarizeShelf), 'shelf sources', { limit: GEO_SNAPSHOT_ITEM_LIMIT }),
  ]);
  const overview = await overviewPromise.catch((error) => {
    controller.abort();
    throw error;
  });
  const results = await resultsPromise;
  const [competitors, contentGaps, agentReadiness, traffic, sentiment, changes, shelf] = results;
  const summary = {
    visibility: summarizeVisibility(overview),
    competitors: competitors.value, contentGaps: contentGaps.value,
    agentReadiness: agentReadiness.value, traffic: traffic.value,
    sentiment: sentiment.value, changes: changes.value, shelf: shelf.value,
  };
  return {
    generatedAt: new Date().toISOString(), window,
    ...summary,
    recommendedNextActions: recommendGeoActions(summary),
    warnings: results.flatMap((result) => result.warnings),
    organization: overview.organization,
  };
}
