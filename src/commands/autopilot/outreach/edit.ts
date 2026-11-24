import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('editOutreachPitch', {
  description: 'Change the recipient, subject or body of a draft before it is sent.',
});
