import { operationBodySchema } from './api-command';

export const updateBrandColorRequestSchema = operationBodySchema('updateBrandColor').refine(
  (body) => Object.keys(body).length > 0,
  'Provide at least one color field to update.',
);
