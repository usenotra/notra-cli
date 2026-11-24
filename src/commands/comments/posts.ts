import { createApiCommand } from '../../cli/api-command';
import { renderCommentedPosts } from '../../utils/comments';

export default createApiCommand('listCommentedPosts', {
  description: 'Find posts with open comments, newest first. Pass --link with a preview or post link to look up that post.',
  render: renderCommentedPosts,
});
