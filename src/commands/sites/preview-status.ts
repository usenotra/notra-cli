import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('getSitePostPreview', {
  description: "Read a post preview's build status, whether it is live, and its URL.",
});
