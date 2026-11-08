import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('getGeoTrafficJourneyStats', {
  description: 'Get AI journey counts per source and page against the previous window. Private beta.',
});
