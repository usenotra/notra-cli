import { operationBodySchema } from './api-command';

export const agentMessageRequestSchema = operationBodySchema('sendAgentSessionMessage').refine(
  (body) => Boolean(body.message) || (Array.isArray(body.inputResponses) && body.inputResponses.length > 0),
  'Provide a message or input responses.',
);
