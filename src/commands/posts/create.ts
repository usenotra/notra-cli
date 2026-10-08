import { createApiCommand } from '../../cli/api-command';
import { createPostRequestSchema } from '../../schemas/posts';

export default createApiCommand('createPost', { bodySchema: createPostRequestSchema });
