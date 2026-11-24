import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('startAutopilotWorkflowRun', {
  description: 'Run a saved custom workflow now. Find its ID with `notra autopilot status`.',
});
