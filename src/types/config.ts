export type ConfigSchema = {
  apiKey?: string;
  baseUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  organizationId?: string;
};

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: number;
  organizationId?: string;
};

export const CONFIG_KEYS = ['api-key', 'base-url'] as const;
export type ConfigKey = (typeof CONFIG_KEYS)[number];

export const DEFAULT_BASE_URL = 'https://api.usenotra.com';
