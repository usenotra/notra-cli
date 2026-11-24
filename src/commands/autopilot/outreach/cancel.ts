import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('cancelOutreachPitch', {
  description: 'Take back a scheduled pitch before it goes out; it becomes a draft again.',
});
