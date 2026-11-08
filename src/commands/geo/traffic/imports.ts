import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('listGeoAnalyticsImports', {
  description: 'List analytics history imports from Plausible, Cloudflare, or Vercel. Private beta.',
});
