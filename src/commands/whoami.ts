import { createApiCommand } from '../cli/api-command';

export default createApiCommand('getWorkspaces', {
  description: 'Show the current workspace and authenticated account.',
});
