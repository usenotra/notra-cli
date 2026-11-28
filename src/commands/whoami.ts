import { createApiCommand } from '../cli/api-command';
import { renderWhoAmI } from '../utils/whoami';

export default createApiCommand('getWorkspaces', {
  description: 'Show the current workspace and authenticated account.',
  render: renderWhoAmI,
});
