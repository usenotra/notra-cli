import { createApiCommand } from '../../cli/api-command';
import { createChatRequestSchema } from '../../schemas/chats';

export default createApiCommand('createChat', {
  response: 'chat',
  bodySchema: createChatRequestSchema,
  defaults: { timeout: 300 },
  description: 'Start a chat and return its reply. Uses AI credits; tools may modify data or external services.',
});
