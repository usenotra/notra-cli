import {
  ACCESS_TOKEN_REFRESH_LEEWAY_MS,
  AUTH_REQUEST_TIMEOUT_MS,
  DEFAULT_DEVICE_POLL_INTERVAL_SECONDS,
  DEVICE_CODE_GRANT_TYPE,
  MILLISECONDS_PER_SECOND,
  PRODUCTION_WORKOS_CLIENT_ID,
  REFRESH_TOKEN_GRANT_TYPE,
  SLOW_DOWN_INTERVAL_INCREMENT_SECONDS,
  WORKOS_AUTHENTICATE_URL,
  WORKOS_CLIENT_ID_ENV_VAR,
  WORKOS_DEVICE_AUTHORIZATION_URL,
} from '../constants/auth';
import type {
  AuthenticationResponse,
  DeviceAuthorizationResponse,
} from '../types/workos';
import {
  authenticationResponseSchema,
  deviceAuthorizationResponseSchema,
  oauthErrorResponseSchema,
} from '../types/workos';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from './config';

export class DeviceAuthorizationError extends Error {
  readonly code: string;

  constructor(code: string, description?: string | null) {
    super(description ?? `Device authorization failed (${code}).`);
    this.name = 'DeviceAuthorizationError';
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

export function getWorkosClientId(): string {
  return process.env[WORKOS_CLIENT_ID_ENV_VAR] ?? PRODUCTION_WORKOS_CLIENT_ID;
}

export async function requestDeviceAuthorization(
  clientId: string,
): Promise<DeviceAuthorizationResponse> {
  const response = await fetch(WORKOS_DEVICE_AUTHORIZATION_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ client_id: clientId }).toString(),
    signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsed = oauthErrorResponseSchema.safeParse(body);
    if (parsed.success) {
      throw new DeviceAuthorizationError(parsed.data.error, parsed.data.error_description);
    }
    throw new DeviceAuthorizationError(`http_${response.status}`);
  }

  return deviceAuthorizationResponseSchema.parse(body);
}

export type DevicePollResult =
  | { status: 'success'; authentication: AuthenticationResponse }
  | { status: 'pending' }
  | { status: 'slow_down' };

export async function pollDeviceAuthorization(
  clientId: string,
  deviceCode: string,
): Promise<DevicePollResult> {
  const response = await fetch(WORKOS_AUTHENTICATE_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: DEVICE_CODE_GRANT_TYPE,
      device_code: deviceCode,
    }).toString(),
    signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
  });
  const body: unknown = await response.json();

  if (response.ok) {
    return { status: 'success', authentication: authenticationResponseSchema.parse(body) };
  }

  const parsed = oauthErrorResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new DeviceAuthorizationError(`http_${response.status}`);
  }
  if (parsed.data.error === 'authorization_pending') return { status: 'pending' };
  if (parsed.data.error === 'slow_down') return { status: 'slow_down' };
  throw new DeviceAuthorizationError(parsed.data.error, parsed.data.error_description);
}

export async function refreshWithRefreshToken(
  clientId: string,
  refreshToken: string,
): Promise<AuthenticationResponse> {
  const response = await fetch(WORKOS_AUTHENTICATE_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: REFRESH_TOKEN_GRANT_TYPE,
      refresh_token: refreshToken,
    }).toString(),
    signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsed = oauthErrorResponseSchema.safeParse(body);
    if (parsed.success) {
      throw new TokenRefreshError(parsed.data.error, parsed.data.error_description);
    }
    throw new TokenRefreshError(`http_${response.status}`);
  }

  return authenticationResponseSchema.parse(body);
}

export function getAccessTokenExpiry(accessToken: string): number | undefined {
  const payloadSegment = accessToken.split('.')[1];
  if (!payloadSegment) return undefined;
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(payloadSegment, 'base64url').toString('utf8'),
    );
    if (payload && typeof payload === 'object' && 'exp' in payload) {
      const { exp } = payload as { exp: unknown };
      if (typeof exp === 'number') return exp * MILLISECONDS_PER_SECOND;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function persistAuthentication(authentication: AuthenticationResponse): void {
  setStoredAuth({
    accessToken: authentication.access_token,
    refreshToken: authentication.refresh_token,
    accessTokenExpiresAt: getAccessTokenExpiry(authentication.access_token),
    organizationId: authentication.organization_id ?? undefined,
  });
}

export async function ensureFreshAccessToken(): Promise<void> {
  const stored = getStoredAuth();
  if (!stored) return;

  const expiresAt = stored.accessTokenExpiresAt;
  const stillFresh =
    expiresAt !== undefined && Date.now() < expiresAt - ACCESS_TOKEN_REFRESH_LEEWAY_MS;
  if (stillFresh) return;

  try {
    const authentication = await refreshWithRefreshToken(
      getWorkosClientId(),
      stored.refreshToken,
    );
    persistAuthentication({
      ...authentication,
      organization_id: authentication.organization_id ?? stored.organizationId,
    });
  } catch (err) {
    if (err instanceof TokenRefreshError && err.code === 'invalid_grant') {
      clearStoredAuth();
      throw new SessionExpiredError();
    }
    throw err;
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Run `notra auth login` to sign in again.');
    this.name = 'SessionExpiredError';
  }
}

export function nextPollIntervalMs(intervalSeconds: number | undefined): number {
  return (
    (intervalSeconds ?? DEFAULT_DEVICE_POLL_INTERVAL_SECONDS) * MILLISECONDS_PER_SECOND
  );
}

export function slowedDownIntervalSeconds(intervalSeconds: number): number {
  return intervalSeconds + SLOW_DOWN_INTERVAL_INCREMENT_SECONDS;
}
