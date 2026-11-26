import { createApiCommand } from '../../../cli/api-command';
import { renderPickRequests } from '../../../utils/geo-pick-reasons';

export default createApiCommand('getGeoPickRequests', {
  description: 'Show how the pick changes with what users ask for (budget, enterprise, pro-level, …): your pick rate, your top competitor\'s and who AI picks most per kind of request. Defaults to the last 30 days.',
  render: renderPickRequests,
});
