import { operationBodySchema } from './api-command';

export const updateGeoContentBriefRequestSchema = operationBodySchema('updateGeoContentBrief').refine(
  (body) => Object.keys(body).length > 0,
  'Provide at least one brief field to update.',
);
