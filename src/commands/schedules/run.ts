import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('runSchedule', {
  description: 'Run an enabled schedule once now. Uses AI credits; follow it with `schedules runs <scheduleId>`.',
});
