import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('getWorkspaces', {
  defaults: { 'include-pending': 'true' },
  description: 'List accessible workspaces. Does not switch the workspace bound to your credentials.',
});
