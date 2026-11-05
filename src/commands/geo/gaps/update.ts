import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('updateGeoContentGap', {
  description: 'Ignore a prompt gap with --ignored, or restore it with --no-ignored.',
});
