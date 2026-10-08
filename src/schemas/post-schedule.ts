import { iso } from 'zod';
import { operationBodySchema } from './api-command';

// The JSON Schema adapter uses UTC-only date-time validation, whereas the
// publishing API accepts explicit UTC offsets as well.
export const schedulePostRequestSchema = operationBodySchema('schedulePost').extend({
  scheduledAt: iso.datetime({ offset: true }),
});
