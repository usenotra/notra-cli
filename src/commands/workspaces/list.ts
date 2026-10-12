import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('getWorkspaces', {
  defaults: { 'include-pending': 'true' },
  description: 'List accessible workspaces. Use `notra workspaces use` to pick one for an account API key.',
});
