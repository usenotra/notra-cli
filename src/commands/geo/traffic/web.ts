import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('getGeoWebAnalytics', {
  description: 'Get website page views, visitors, sessions, and AI-referred visitors with a daily trend. Private beta.',
});
