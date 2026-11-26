import { createApiCommand } from '../../../cli/api-command';
import { renderPickReasonEvidence } from '../../../utils/geo-pick-reasons';

export default createApiCommand('listGeoPickReasonEvidence', {
  description: 'List the answers that picked a brand for one reason, newest first: engine, date, prompt and quote. Defaults to the last 30 days.',
  render: renderPickReasonEvidence,
});
