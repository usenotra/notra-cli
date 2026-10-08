import { operationBodySchema } from './api-command';

export const patchSkillRequestSchema = operationBodySchema('patchSkill').refine(
  (body) => Object.keys(body).length > 0,
  'Provide at least one skill field to update.',
);
