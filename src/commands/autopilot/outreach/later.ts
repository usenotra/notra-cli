import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('laterOutreachPitch', {
  description: 'Put a draft off until the next daily brief.',
});
