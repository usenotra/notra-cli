import * as z from 'zod';
import { organizationSchema } from './common';

// Decode the fields used by the compact snapshot, preserving additional API
// fields in evidence and summaries rather than claiming to model every report.
export const snapshotOverviewSchema = z.object({
  organization: organizationSchema,
  configured: z.boolean(),
  engines: z.array(z.object({
    checks: z.number(), mentions: z.number(), citations: z.number(),
    visibility: z.number(), avgPosition: z.number().nullable(),
  }).passthrough()),
}).passthrough();

export const snapshotCompetitorsSchema = z.object({
  points: z.array(z.object({ mentions: z.number() }).passthrough()),
}).passthrough();

export const snapshotGapsSchema = z.object({
  hasScanData: z.boolean(),
  promptGaps: z.array(z.object({ opportunity: z.number() }).passthrough()),
  searchGaps: z.array(z.object({ impressions: z.number().nullable() }).passthrough()),
}).passthrough();

export const snapshotReadinessSchema = z.object({
  targetUrl: z.string().nullable(),
  report: z.object({
    status: z.string(), score: z.number().nullable(), scoreLabel: z.string().nullable(),
    issues: z.array(z.unknown()),
  }).passthrough().nullable(),
  scan: z.object({ status: z.string() }).passthrough().nullable(),
}).passthrough();

export const snapshotTrafficSchema = z.object({
  configured: z.boolean(), totals: z.record(z.string(), z.unknown()),
  sources: z.array(z.object({ visits: z.number() }).passthrough()),
}).passthrough();

export const snapshotSentimentSchema = z.object({
  summary: z.object({ negativeShare: z.number().nullable() }).passthrough(),
}).passthrough();

export const snapshotChangesSchema = z.object({
  summary: z.object({ lost: z.number(), citationsRemoved: z.number() }).passthrough(),
}).passthrough();

export const snapshotShelfSchema = z.object({
  sources: z.array(z.unknown()), nextOffset: z.number().nullable(),
}).passthrough();
