import { createApiCommand } from '../../cli/api-command';

export default createApiCommand('listGeoEngines', {
  description: 'List the answer engine IDs a project can track. Use them with `geo settings update`.',
});
