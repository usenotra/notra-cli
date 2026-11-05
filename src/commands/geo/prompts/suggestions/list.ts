import { createApiCommand } from '../../../../cli/api-command';

export default createApiCommand('listGeoPromptSuggestions', {
  description: 'List prompts suggested from Google Search Console queries. Empty until Search Console is connected.',
});
