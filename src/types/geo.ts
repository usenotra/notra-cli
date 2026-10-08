import type { z } from 'zod';
import type {
  snapshotChangesSchema, snapshotCompetitorsSchema, snapshotGapsSchema,
  snapshotOverviewSchema, snapshotReadinessSchema, snapshotSentimentSchema,
  snapshotShelfSchema, snapshotTrafficSchema,
} from '../schemas/geo-snapshot';
import type {
  summarizeCompetitors, summarizeContentGaps, summarizeReadiness,
  summarizeShelf, summarizeTraffic, summarizeVisibility,
} from '../utils/geo-snapshot-sections';

export type GeoWindow = { days?: number; from?: string; to?: string };
export type GeoSnapshotAction = { priority: 'high' | 'medium' | 'low'; action: string; reason: string };
export type GeoSnapshotWarning = { section: Exclude<keyof GeoSnapshotData, 'overview'>; message: string };

export type GeoSnapshotData = {
  overview: z.infer<typeof snapshotOverviewSchema>;
  competitors: z.infer<typeof snapshotCompetitorsSchema>;
  contentGaps: z.infer<typeof snapshotGapsSchema>;
  agentReadiness: z.infer<typeof snapshotReadinessSchema>;
  traffic: z.infer<typeof snapshotTrafficSchema>;
  sentiment: z.infer<typeof snapshotSentimentSchema>;
  changes: z.infer<typeof snapshotChangesSchema>;
  shelf: z.infer<typeof snapshotShelfSchema>;
};

export type GeoSnapshotSummary = {
  visibility: ReturnType<typeof summarizeVisibility>;
  competitors: ReturnType<typeof summarizeCompetitors> | null;
  contentGaps: ReturnType<typeof summarizeContentGaps> | null;
  agentReadiness: ReturnType<typeof summarizeReadiness> | null;
  traffic: ReturnType<typeof summarizeTraffic> | null;
  sentiment: GeoSnapshotData['sentiment']['summary'] | null;
  changes: GeoSnapshotData['changes']['summary'] | null;
  shelf: ReturnType<typeof summarizeShelf> | null;
};

export type GeoSnapshotSectionResult<Output> = {
  value: Output | null;
  warnings: GeoSnapshotWarning[];
};
