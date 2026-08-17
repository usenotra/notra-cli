export const WORKOS_API_URL = 'https://api.workos.com';
export const WORKOS_DEVICE_AUTHORIZATION_URL = `${WORKOS_API_URL}/user_management/authorize/device`;
export const WORKOS_AUTHENTICATE_URL = `${WORKOS_API_URL}/user_management/authenticate`;

export const PRODUCTION_WORKOS_CLIENT_ID = 'client_01M02GCR508YHEAXTVSE8XR130';
export const WORKOS_CLIENT_ID_ENV_VAR = 'NOTRA_WORKOS_CLIENT_ID';

export const DEVICE_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';
export const REFRESH_TOKEN_GRANT_TYPE = 'refresh_token';

export const AUTH_REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_DEVICE_POLL_INTERVAL_SECONDS = 5;
export const SLOW_DOWN_INTERVAL_INCREMENT_SECONDS = 5;
export const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 60_000;
export const MILLISECONDS_PER_SECOND = 1000;
