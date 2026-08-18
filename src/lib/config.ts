import { chmodSync } from 'node:fs';
import Conf from 'conf';
import type { ConfigKey, ConfigSchema, StoredAuth } from '../types/config';
import { DEFAULT_BASE_URL } from '../types/config';

let store: Conf<ConfigSchema> | undefined;

function getStore(): Conf<ConfigSchema> {
  if (!store) {
    store = new Conf<ConfigSchema>({
      projectName: 'notra-cli',
      schema: {
        apiKey: { type: 'string' },
        baseUrl: { type: 'string', format: 'uri' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        accessTokenExpiresAt: { type: 'number' },
        organizationId: { type: 'string' },
      },
      configFileMode: 0o600,
    });
    chmodConfigFile(store.path);
  }
  return store;
}

export function getApiKey(): string | undefined {
  return process.env.NOTRA_API_KEY ?? getStore().get('apiKey');
}

export function getBaseUrl(): string {
  return process.env.NOTRA_BASE_URL ?? getStore().get('baseUrl') ?? DEFAULT_BASE_URL;
}

export function getStoredAuth(): StoredAuth | undefined {
  const s = getStore();
  const accessToken = s.get('accessToken');
  const refreshToken = s.get('refreshToken');
  if (!accessToken || !refreshToken) return undefined;
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: s.get('accessTokenExpiresAt'),
    organizationId: s.get('organizationId'),
  };
}

export function setStoredAuth(auth: StoredAuth): void {
  const s = getStore();
  s.set('accessToken', auth.accessToken);
  s.set('refreshToken', auth.refreshToken);
  if (auth.accessTokenExpiresAt === undefined) {
    s.delete('accessTokenExpiresAt');
  } else {
    s.set('accessTokenExpiresAt', auth.accessTokenExpiresAt);
  }
  if (auth.organizationId === undefined) {
    s.delete('organizationId');
  } else {
    s.set('organizationId', auth.organizationId);
  }
}

export function clearStoredAuth(): void {
  const s = getStore();
  s.delete('accessToken');
  s.delete('refreshToken');
  s.delete('accessTokenExpiresAt');
  s.delete('organizationId');
}

export function setConfigValue(key: ConfigKey, value: string): void {
  const s = getStore();
  if (key === 'api-key') {
    s.set('apiKey', value);
  } else if (key === 'base-url') {
    s.set('baseUrl', value);
  }
}

export function clearConfigValue(key: ConfigKey): void {
  const s = getStore();
  if (key === 'api-key') {
    s.delete('apiKey');
  } else if (key === 'base-url') {
    s.delete('baseUrl');
  }
}

export function getConfigValue(key: ConfigKey): string | undefined {
  const s = getStore();
  if (key === 'api-key') return s.get('apiKey');
  if (key === 'base-url') return s.get('baseUrl');
  return undefined;
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
    const code = (err as { code?: string }).code;
    if (code !== 'ENOENT') throw err;
  }
}
