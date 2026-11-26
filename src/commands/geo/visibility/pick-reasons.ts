import { createApiCommand } from '../../../cli/api-command';
import { renderPickReasons } from '../../../utils/geo-pick-reasons';

export default createApiCommand('getGeoPickReasons', {
  description: 'Show why AI answers pick your brand and each competitor: picks and the reasons they cite, such as price or integrations. Defaults to the last 30 days; --json adds the per-engine breakdown.',
  render: renderPickReasons,
});
