import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('getAutopilotStatus', {
  description: 'Show Autopilot settings, active runs, custom workflows, open findings, and rules.',
});
