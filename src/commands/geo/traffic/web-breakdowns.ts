import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('getGeoWebAnalyticsBreakdowns', {
  description: 'Get website top pages, sources, countries, devices, languages, outbound clicks, Web Vitals, and errors. Private beta.',
});
