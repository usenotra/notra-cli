import { createApiCommand } from '../../cli/api-command';
import { schedulePostRequestSchema } from '../../schemas/post-schedule';

export default createApiCommand('schedulePost', { bodySchema: schedulePostRequestSchema });
