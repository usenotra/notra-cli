import { createApiCommand } from '../../../cli/api-command';
import { createWebhookRequestSchema } from '../../../schemas/webhooks';

export default createApiCommand('createWebhookEndpoint', {
  bodySchema: createWebhookRequestSchema,
  description: 'Subscribe an HTTPS endpoint to Notra events. Store the signing secret: it is shown only once.',
});
