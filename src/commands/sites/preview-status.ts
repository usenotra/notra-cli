import { createApiCommand } from '../../cli/api-command';
import { describePostPreview, postPreviewWatchStatus } from '../../utils/post-preview';

export default createApiCommand('getSitePostPreview', {
  description:
    "Read a post preview's build status and URL. Share the URL once latestLive is true; --watch waits for that or a failed build.",
  watch: { status: postPreviewWatchStatus, describe: describePostPreview },
});
