import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('sendOutreachPitch', {
  description: 'Send a draft from the connected mailbox now, or schedule it with --send-at (an ISO time or "suggested"). Emails a real person.',
  confirm: true,
});
