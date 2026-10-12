import { chmodSync } from 'node:fs';
import Conf from 'conf';
import {
  DEFAULT_BASE_URL,
  NOTRA_API_KEY_ENV_VAR,
  NOTRA_BASE_URL_ENV_VAR,
} from '../constants/config';
import { CONFIG_SCHEMA } from '../schemas/config';
import type { ConfigKey, ConfigSchema, StoredAuth } from '../types/config';

let store: Conf<ConfigSchema> | undefined;

// Kept apart from the OAuth session's organizationId: that one mirrors the
// token's workspace claim and is rewritten on every login and refresh.
const CONFIG_KEY_FIELDS = {
  'api-key': 'apiKey',
  'base-url': 'baseUrl',
  'organization-id': 'selectedOrganizationId',
} as const satisfies Record<ConfigKey, keyof ConfigSchema>;

function getStore(): Conf<ConfigSchema> {
  if (!store) {
    store = new Conf<ConfigSchema>({
      projectName: 'notra-cli',
      schema: CONFIG_SCHEMA,
      configFileMode: 0o600,
    });
    chmodConfigFile(store.path);
  }
  return store;
}

export function getApiKey(): string | undefined {
  return process.env[NOTRA_API_KEY_ENV_VAR] ?? getStore().get('apiKey');
}

export function getBaseUrl(): string {
  return process.env[NOTRA_BASE_URL_ENV_VAR] ?? getStore().get('baseUrl') ?? DEFAULT_BASE_URL;
}

export function getStoredAuth(): StoredAuth | undefined {
  const s = getStore().store;
  const { accessToken, refreshToken } = s;
  if (!accessToken || !refreshToken) return undefined;
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: s.accessTokenExpiresAt,
    organizationId: s.organizationId,
    clientId: s.authClientId,
    issuer: s.authIssuer,
  };
}

export function setStoredAuth(auth: StoredAuth): void {
  const s = getStore();
  const next = {
    ...s.store,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    accessTokenExpiresAt: auth.accessTokenExpiresAt,
    organizationId: auth.organizationId,
    authClientId: auth.clientId,
    authIssuer: auth.issuer,
  };
  if (auth.accessTokenExpiresAt === undefined) {
    delete next.accessTokenExpiresAt;
  }
  if (auth.organizationId === undefined) {
    delete next.organizationId;
  }
  if (auth.clientId === undefined) delete next.authClientId;
  if (auth.issuer === undefined) delete next.authIssuer;
  s.store = next;
}

export function clearStoredAuth(): void {
  const s = getStore();
  const next = { ...s.store };
  delete next.accessToken;
  delete next.refreshToken;
  delete next.accessTokenExpiresAt;
  delete next.organizationId;
  delete next.authClientId;
  delete next.authIssuer;
  s.store = next;
}

export function getOAuthClientId(issuer: string, redirectUri: string): string | undefined {
  const s = getStore();
  return s.get('oauthIssuer') === issuer && s.get('oauthRedirectUri') === redirectUri
    ? s.get('oauthClientId') : undefined;
}

export function getOAuthRedirectUri(issuer: string): string | undefined {
  const s = getStore();
  return s.get('oauthIssuer') === issuer ? s.get('oauthRedirectUri') : undefined;
}

export function setOAuthClientId(issuer: string, clientId: string, redirectUri: string): void {
  const s = getStore();
  s.store = { ...s.store, oauthIssuer: issuer, oauthClientId: clientId, oauthRedirectUri: redirectUri };
}

export function setConfigValue(key: ConfigKey, value: string): void {
  getStore().set(CONFIG_KEY_FIELDS[key], value);
}

export function clearConfigValue(key: ConfigKey): void {
  getStore().delete(CONFIG_KEY_FIELDS[key]);
}

export function getConfigValue(key: ConfigKey): string | undefined {
  return getStore().get(CONFIG_KEY_FIELDS[key]);
}

export function getAllConfig(): ConfigSchema {
  return { ...getStore().store };
}

export function getConfigPath(): string {
  return getStore().path;
}

function chmodConfigFile(path: string): void {
  try {
    chmodSync(path, 0o600);
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err ? err.code : undefined;
    if (code !== 'ENOENT') throw err;
  }
}
