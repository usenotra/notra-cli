import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('startAutopilotRun', {
  description: 'Run Autopilot now. Use --kind to run one built-in automation. Uses AI credits and may open pull requests.',
});
