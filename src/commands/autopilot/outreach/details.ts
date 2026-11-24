import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('updateOutreachPitchDetails', {
  description: 'Correct the stage, follow-up date or deal Autopilot read from the thread.',
});
