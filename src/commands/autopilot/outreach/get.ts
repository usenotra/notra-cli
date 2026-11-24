import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('getOutreachPitch', {
  description: 'Show one pitch: the email, why the page was picked, ways to reach the editor, the suggested send time and the reply thread.',
});
