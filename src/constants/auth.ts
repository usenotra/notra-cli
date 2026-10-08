export const DEFAULT_OAUTH_ISSUER = 'https://oauth.usenotra.com';
export const OAUTH_ISSUER_ENV_VAR = 'NOTRA_OAUTH_ISSUER';
export const WORKOS_CLIENT_ID_ENV_VAR = 'NOTRA_WORKOS_CLIENT_ID';
export const OAUTH_SCOPES = ['openid', 'offline_access'] as const;
export const OAUTH_WORKSPACE_CLAIM = 'urn:notra:workspace';
export const OAUTH_CLIENT_NAME = 'Notra CLI';
export const OAUTH_CLIENT_URI = 'https://github.com/usenotra/notra-cli';
export const OAUTH_LOGIN_TIMEOUT_MS = 600_000;
export const AUTHORIZATION_CODE_GRANT_TYPE = 'authorization_code';

export const REFRESH_TOKEN_GRANT_TYPE = 'refresh_token';

export const AUTH_REQUEST_TIMEOUT_MS = 10_000;
export const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 60_000;
export const MILLISECONDS_PER_SECOND = 1000;

export const AUTH_LOCK_OPTIONS = {
  realpath: false,
  stale: 30_000,
  retries: { retries: 100, factor: 1.2, minTimeout: 100, maxTimeout: 500 },
};
