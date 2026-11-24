import { createApiCommand } from '../../../../cli/api-command';

export default createApiCommand('disconnectOutreachMailbox', {
  description: 'Stop sending from the connected mailbox. Scheduled pitches go back to drafts.',
});
