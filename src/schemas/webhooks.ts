import { operationBodySchema } from './api-command';

export const createWebhookRequestSchema = operationBodySchema('createWebhookEndpoint').refine(
  (body) => typeof body.url === 'string' && body.url.startsWith('https://'),
  'Webhook endpoints must use HTTPS.',
);
