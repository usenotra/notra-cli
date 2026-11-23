import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('createSitePostPreview', {
  description:
    "Preview a saved post on a Site, without a branch or pull request. Run it again after editing the post to rebuild the same preview; lifetime and password stay unless you pass new ones.",
});
