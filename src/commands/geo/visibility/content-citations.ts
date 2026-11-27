import { createApiCommand } from '../../../cli/api-command';

export default createApiCommand('getGeoContentCitations', {
  description: 'List posts published for a GEO project, when AI answers first cited them, and how their targeted prompt moved against the others.',
});
