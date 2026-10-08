import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('streamAgentSessionEvents', { response: 'ndjson' });
