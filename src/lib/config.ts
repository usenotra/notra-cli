import Conf from 'conf';
import type { ConfigKey, ConfigSchema } from '../types/config';
import { DEFAULT_BASE_URL, DEFAULT_DASHBOARD_URL } from '../types/config';

let store: Conf<ConfigSchema> | undefined;

function getStore(): Conf<ConfigSchema> {
  if (!store) {
    store = new Conf<ConfigSchema>({
      projectName: 'notra-cli',
      schema: {
        apiKey: { type: 'string' },
        baseUrl: { type: 'string', format: 'uri' },
        dashboardUrl: { type: 'string', format: 'uri' },
      },
    });
  }
  return store;
}

export function getApiKey(): string | undefined {
  return process.env.NOTRA_API_KEY ?? getStore().get('apiKey');
}

export function getBaseUrl(): string {
  return process.env.NOTRA_BASE_URL ?? getStore().get('baseUrl') ?? DEFAULT_BASE_URL;
}

export function getDashboardUrl(): string {
  return (
    process.env.NOTRA_DASHBOARD_URL ??
    getStore().get('dashboardUrl') ??
    DEFAULT_DASHBOARD_URL
  );
}

export function setConfigValue(key: ConfigKey, value: string): void {
  const s = getStore();
  if (key === 'api-key') {
    s.set('apiKey', value);
  } else if (key === 'base-url') {
    s.set('baseUrl', value);
  } else if (key === 'dashboard-url') {
    s.set('dashboardUrl', value);
  }
}

export function clearConfigValue(key: ConfigKey): void {
  const s = getStore();
  if (key === 'api-key') {
    s.delete('apiKey');
  } else if (key === 'base-url') {
    s.delete('baseUrl');
  } else if (key === 'dashboard-url') {
    s.delete('dashboardUrl');
  }
}

export function getConfigValue(key: ConfigKey): string | undefined {
  const s = getStore();
  if (key === 'api-key') return s.get('apiKey');
  if (key === 'base-url') return s.get('baseUrl');
  if (key === 'dashboard-url') return s.get('dashboardUrl');
  return undefined;
}

export function getAllConfig(): ConfigSchema {
  return { ...getStore().store };
}

export function getConfigPath(): string {
  return getStore().path;
}
