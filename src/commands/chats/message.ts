import { createApiCommand } from '../../cli/api-command';
import { postChatMessageRequestSchema } from '../../schemas/chats';

export default createApiCommand('postChatMessage', {
  response: 'chat',
  bodySchema: postChatMessageRequestSchema,
  defaults: { timeout: 300 },
  description: 'Send a message or tool approvals to a chat. Uses AI credits; tools may modify data or external services.',
});
