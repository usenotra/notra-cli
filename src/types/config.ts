export type ConfigSchema = {
  apiKey?: string;
  baseUrl?: string;
  dashboardUrl?: string;
};

export const CONFIG_KEYS = ['api-key', 'base-url', 'dashboard-url'] as const;
export type ConfigKey = (typeof CONFIG_KEYS)[number];

export const DEFAULT_BASE_URL = 'https://api.usenotra.com';
export const DEFAULT_DASHBOARD_URL = 'https://app.usenotra.com';
