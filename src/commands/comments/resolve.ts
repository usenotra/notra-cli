import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('resolvePostComments', {
  description: 'Mark comment threads done after your edit addressed them.',
});
