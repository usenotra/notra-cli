import { createApiCommand } from '../../../../cli/api-command';

export default createApiCommand('getOutreachMailbox', {
  description: 'Show the Gmail or Outlook mailbox pitches go out from, and the link to connect one in a browser.',
});
