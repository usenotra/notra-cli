import { createApiCommand } from '../../../../cli/api-command';

export default createApiCommand('dismissGeoPromptSuggestion', {
  description: 'Dismiss a suggested prompt without tracking it. This cannot be undone.',
});
