import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('markOutreachPitchSent', {
  description: 'Record that someone sent the pitch themselves, through the page\'s form or their own mail app.',
});
