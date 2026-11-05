import { createApiCommand } from '../../../cli/api-command';
import { updateBrandColorRequestSchema } from '../../../schemas/brand-colors';

export default createApiCommand('updateBrandColor', { bodySchema: updateBrandColorRequestSchema });
