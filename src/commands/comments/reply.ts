import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('replyToPostComment', {
  description: 'Answer an open comment thread as yourself. Needs an OAuth sign-in or account key.',
});
