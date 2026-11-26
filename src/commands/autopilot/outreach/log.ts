import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('logOutreachPitch', {
  description: 'Log someone you contacted yourself (email, form, call or in person) with its stage, follow-up and notes. Nothing is sent.',
});
