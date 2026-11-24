import { createApiCommand } from '../../../cli/api-command';

// Only brings a draft back, so it doesn't ask like other deletes.
export default createApiCommand('undoLaterOutreachPitch', {
  description: 'Bring a draft put off with later back to where it was.',
  confirm: false,
});
