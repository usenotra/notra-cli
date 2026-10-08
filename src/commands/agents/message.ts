import { createApiCommand } from '../../cli/api-command';
import { agentMessageRequestSchema } from '../../schemas/agents';

export default createApiCommand('sendAgentSessionMessage', { bodySchema: agentMessageRequestSchema });
