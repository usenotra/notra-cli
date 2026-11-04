import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('getGitHubActivity', {
  description: 'List merged pull requests, commits or releases in a connected GitHub repository.',
});
