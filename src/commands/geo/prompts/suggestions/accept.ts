import { createApiCommand } from '../../../../cli/api-command';

export default createApiCommand('acceptGeoPromptSuggestion', {
  description: 'Track a suggested prompt. Returns the existing prompt if it is already tracked.',
});
