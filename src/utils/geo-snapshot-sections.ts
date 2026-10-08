import type { GeoSnapshotData } from '../types/geo';
import { GEO_SNAPSHOT_ITEM_LIMIT } from '../constants/geo';

export function summarizeCompetitors(data: GeoSnapshotData['competitors']) {
  return {
    tracked: data.points.length,
    leaders: [...data.points].sort((a, b) => b.mentions - a.mentions).slice(0, GEO_SNAPSHOT_ITEM_LIMIT),
  };
}

export function summarizeContentGaps(data: GeoSnapshotData['contentGaps']) {
  return {
    hasScanData: data.hasScanData,
    promptGapCount: data.promptGaps.length,
    searchGapCount: data.searchGaps.length,
    topPromptGaps: [...data.promptGaps].sort((a, b) => b.opportunity - a.opportunity).slice(0, GEO_SNAPSHOT_ITEM_LIMIT),
    topSearchGaps: [...data.searchGaps].sort((a, b) => (b.impressions ?? -1) - (a.impressions ?? -1)).slice(0, GEO_SNAPSHOT_ITEM_LIMIT),
  };
}

export function summarizeReadiness(data: GeoSnapshotData['agentReadiness']) {
  return {
    targetUrl: data.targetUrl,
    status: data.scan?.status ?? data.report?.status ?? 'not_scanned',
    score: data.report?.score ?? null,
    scoreLabel: data.report?.scoreLabel ?? null,
    topIssues: (data.report?.issues ?? []).slice(0, GEO_SNAPSHOT_ITEM_LIMIT),
  };
}

export function summarizeTraffic(data: GeoSnapshotData['traffic']) {
  return {
    configured: data.configured,
    totals: data.totals,
    topSources: [...data.sources].sort((a, b) => b.visits - a.visits).slice(0, GEO_SNAPSHOT_ITEM_LIMIT),
  };
}

export function summarizeShelf(data: GeoSnapshotData['shelf']) {
  return {
    returnedSources: data.sources.length,
    hasMore: data.nextOffset !== null,
    topSources: data.sources,
  };
}

export function summarizeVisibility(overview: GeoSnapshotData['overview']) {
  const checks = overview.engines.reduce((sum, engine) => sum + engine.checks, 0);
  const mentions = overview.engines.reduce((sum, engine) => sum + engine.mentions, 0);
  const positioned = overview.engines.filter((engine) => engine.avgPosition !== null && engine.mentions > 0);
  const weight = positioned.reduce((sum, engine) => sum + engine.mentions, 0);
  const visibility = overview.engines.reduce((sum, engine) => sum + engine.visibility, 0);
  return {
    configured: overview.configured, checks, mentions,
    mentionRate: checks === 0 ? 0 : mentions / checks,
    citations: overview.engines.reduce((sum, engine) => sum + engine.citations, 0),
    visibility, visibilityRate: checks === 0 ? 0 : visibility / checks,
    avgPosition: weight === 0 ? null : positioned.reduce((sum, engine) => sum + (engine.avgPosition ?? 0) * engine.mentions, 0) / weight,
    engines: overview.engines,
  };
}
