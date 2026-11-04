import { operationBodySchema } from './api-command';

export const updateGeoContentBriefRequestSchema = operationBodySchema('updateGeoContentBrief').refine(
  // expectedUpdatedAt is a concurrency check, not a field to change.
  (body) => Object.keys(body).some((key) => key !== 'expectedUpdatedAt'),
  'Provide at least one brief field to update.',
);
