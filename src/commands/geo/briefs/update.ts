import { createApiCommand } from '../../../cli/api-command';
import { updateGeoContentBriefRequestSchema } from '../../../schemas/geo-briefs';

export default createApiCommand('updateGeoContentBrief', {
  bodySchema: updateGeoContentBriefRequestSchema,
  description: 'Edit a draft or failed GEO content brief. List fields replace the whole list.',
});
