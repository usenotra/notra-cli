import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('listOutreachPitches', {
  description: 'List outreach pitches, newest activity first. Filter with --status, --stage, --follow-up-due or --search.',
});
