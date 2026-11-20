import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('stopAutopilotRun', {
  description: 'Stop an active run. Find its ID with `notra autopilot status`.',
  confirm: true,
});
