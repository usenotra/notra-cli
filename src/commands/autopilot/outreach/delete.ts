import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('deleteOutreachPitch', {
  description: 'Delete a pitch that should not go out. The page is not pitched again.',
});
