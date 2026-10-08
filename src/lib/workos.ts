import {
  ACCESS_TOKEN_REFRESH_LEEWAY_MS,
  AUTHORIZATION_CODE_GRANT_TYPE,
  DEFAULT_OAUTH_ISSUER,
  MILLISECONDS_PER_SECOND,
  OAUTH_CLIENT_NAME,
  OAUTH_CLIENT_URI,
  OAUTH_ISSUER_ENV_VAR,
  OAUTH_SCOPES,
  OAUTH_WORKSPACE_CLAIM,
  REFRESH_TOKEN_GRANT_TYPE,
  WORKOS_CLIENT_ID_ENV_VAR,
} from '../constants/auth';
import { DEFAULT_BASE_URL } from '../constants/config';
import {
  authenticationResponseSchema,
  oauthErrorResponseSchema,
  oauthClientResponseSchema,
  refreshResponseSchema,
} from '../schemas/workos';
import type { AuthenticationResponse } from '../types/workos';
import { clearStoredAuth, getOAuthClientId, getStoredAuth, setOAuthClientId, setStoredAuth } from './config';
import { fetchOAuthJson } from '../utils/oauth-request';
import { readTokenPayload } from '../utils/token-payload';
import type { OAuthAuthorizationParameters } from '../types/oauth';
import { withAuthLock } from '../utils/auth-lock';

export class OAuthAuthorizationError extends Error {
  readonly code: string;

  constructor(code: string, description?: string | null) {
    super(description ?? `OAuth authorization failed (${code}).`);
    this.name = 'OAuthAuthorizationError';
    this.code = code;
  }
}

export class TokenRefreshError extends Error {
  readonly code: string;

  constructor(code: string, description?: string | null) {
    super(description ?? `Token refresh failed (${code}).`);
    this.name = 'TokenRefreshError';
    this.code = code;
  }
}

export function getOAuthIssuer(value = process.env[OAUTH_ISSUER_ENV_VAR] ?? DEFAULT_OAUTH_ISSUER): string {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
    url.username || url.password || url.search || url.hash || url.pathname !== '/'
  ) {
    throw new Error('NOTRA_OAUTH_ISSUER must be an HTTPS origin (HTTP is only allowed for localhost).');
  }
  return url.origin;
}

export async function getWorkosClientId(redirectUri: string): Promise<string> {
  const override = process.env[WORKOS_CLIENT_ID_ENV_VAR];
  if (override !== undefined) {
    if (!override.trim()) throw new OAuthAuthorizationError('invalid_client', 'NOTRA_WORKOS_CLIENT_ID must not be empty.');
    return override.trim();
  }
  const issuer = getOAuthIssuer();
  const cached = getOAuthClientId(issuer, redirectUri);
  if (cached) return cached;
  const { response, body } = await fetchOAuthJson(`${issuer}/oauth2/register`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_name: OAUTH_CLIENT_NAME,
      client_uri: OAUTH_CLIENT_URI,
      redirect_uris: [redirectUri],
      response_types: ['code'],
      grant_types: [AUTHORIZATION_CODE_GRANT_TYPE, REFRESH_TOKEN_GRANT_TYPE],
      token_endpoint_auth_method: 'none',
    }),
  });
  if (!response.ok) {
    const parsed = oauthErrorResponseSchema.safeParse(body);
    throw new OAuthAuthorizationError(
      parsed.success ? parsed.data.error : `http_${response.status}`,
      'Could not register a public Connect client. Enable dynamic client registration or set NOTRA_WORKOS_CLIENT_ID to a public Connect application client ID.',
    );
  }
  const client = oauthClientResponseSchema.parse(body);
  await withAuthLock(() => setOAuthClientId(issuer, client.client_id, redirectUri));
  return client.client_id;
}

export function getAuthorizationUrl(parameters: OAuthAuthorizationParameters): string {
  const url = new URL('/oauth2/authorize', getOAuthIssuer());
  url.search = new URLSearchParams({
    client_id: parameters.clientId,
    redirect_uri: parameters.redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES.join(' '),
    resource: DEFAULT_BASE_URL,
    state: parameters.state,
    nonce: parameters.nonce,
    code_challenge: parameters.codeChallenge,
    code_challenge_method: 'S256',
  }).toString();
  return url.href;
}

export async function exchangeAuthorizationCode(
  clientId: string,
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<AuthenticationResponse> {
  const { response, body } = await fetchOAuthJson(`${getOAuthIssuer()}/oauth2/token`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: AUTHORIZATION_CODE_GRANT_TYPE,
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      resource: DEFAULT_BASE_URL,
    }).toString(),
  });
  if (!response.ok) {
    const parsed = oauthErrorResponseSchema.safeParse(body);
    throw new OAuthAuthorizationError(
      parsed.success ? parsed.data.error : `http_${response.status}`,
      parsed.success ? parsed.data.error_description : undefined,
    );
  }
  return authenticationResponseSchema.parse(body);
}

export async function refreshWithRefreshToken(
  clientId: string,
  refreshToken: string,
  issuer = getOAuthIssuer(),
): Promise<AuthenticationResponse> {
  const { response, body } = await fetchOAuthJson(`${getOAuthIssuer(issuer)}/oauth2/token`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: REFRESH_TOKEN_GRANT_TYPE,
      refresh_token: refreshToken,
      resource: DEFAULT_BASE_URL,
    }).toString(),
  });

  if (!response.ok) {
    const parsed = oauthErrorResponseSchema.safeParse(body);
    if (parsed.success) {
      throw new TokenRefreshError(parsed.data.error, parsed.data.error_description);
    }
    throw new TokenRefreshError(`http_${response.status}`);
  }

  const authentication = refreshResponseSchema.parse(body);
  return { ...authentication, refresh_token: authentication.refresh_token ?? refreshToken };
}

export function getAccessTokenExpiry(accessToken: string): number | undefined {
  const exp = readTokenPayload(accessToken)?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) ? exp * MILLISECONDS_PER_SECOND : undefined;
}

export function persistAuthentication(authentication: AuthenticationResponse, clientId: string, issuer = getOAuthIssuer()): void {
  // Unverified JWT claims are only local display/refresh hints. The API verifies
  // the signature, issuer, audience and workspace before granting access.
  const payload = readTokenPayload(authentication.access_token);
  const organization = payload?.[OAUTH_WORKSPACE_CLAIM] ?? authentication.organization_id ?? payload?.org_id;
  setStoredAuth({
    accessToken: authentication.access_token,
    refreshToken: authentication.refresh_token,
    accessTokenExpiresAt: getAccessTokenExpiry(authentication.access_token) ??
      (authentication.expires_in === undefined ? undefined : Date.now() + authentication.expires_in * MILLISECONDS_PER_SECOND),
    organizationId: typeof organization === 'string' ? organization : undefined,
    clientId,
    issuer: getOAuthIssuer(issuer),
  });
}

export async function ensureFreshAccessToken(): Promise<void> {
  if (!getStoredAuth()) return;
  await withAuthLock(async () => {
    // A different CLI process may have refreshed or logged out while we waited.
    const stored = getStoredAuth();
    if (!stored) return;

    if (!stored.clientId || !stored.issuer) {
      clearStoredAuth();
      throw new SessionExpiredError();
    }

    const expiresAt = stored.accessTokenExpiresAt;
    const stillFresh =
      expiresAt !== undefined && Date.now() < expiresAt - ACCESS_TOKEN_REFRESH_LEEWAY_MS;
    if (stillFresh) return;

    try {
      const authentication = await refreshWithRefreshToken(
        stored.clientId,
        stored.refreshToken,
        stored.issuer,
      );
      persistAuthentication({
        ...authentication,
        organization_id: stored.organizationId ?? authentication.organization_id,
      }, stored.clientId, stored.issuer);
    } catch (err) {
      if (err instanceof TokenRefreshError && err.code === 'invalid_grant') {
        clearStoredAuth();
        throw new SessionExpiredError();
      }
      throw err;
    }
  });
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Run `notra auth login` to sign in again.');
    this.name = 'SessionExpiredError';
  }
}
