export const MAX_NDJSON_EVENT_BYTES = 1024 * 1024;
export const NDJSON_INITIAL_BUFFER_BYTES = 1024;

// Account API keys work in every workspace the user belongs to; this header picks
// the workspace per request. Organization keys and OAuth tokens ignore it.
export const ORGANIZATION_ID_HEADER = 'X-Notra-Organization-Id';

// Matched case-insensitively against the API's 403 messages, as prefixes, so
// added detail after them keeps the CLI hint working.
export const ORGANIZATION_SELECTION_REQUIRED_PREFIX = 'organization selection required';
export const WORKSPACE_ACCESS_REVOKED_PREFIX = 'workspace access revoked';
