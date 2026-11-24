import { createApiCommand } from '../../cli/api-command';
import { renderPostComments } from '../../utils/comments';

export default createApiCommand('listPostComments', {
  description: "Read a post's comment threads from the editor and its site preview. Use --status all to include resolved ones.",
  render: renderPostComments,
});
