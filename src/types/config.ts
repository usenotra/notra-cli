import { CONFIG_KEYS } from '../constants/config';

export type ConfigSchema = {
  apiKey?: string;
  baseUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  organizationId?: string;
  authClientId?: string;
  authIssuer?: string;
  oauthClientId?: string;
  oauthIssuer?: string;
  oauthRedirectUri?: string;
};

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: number;
  organizationId?: string;
  clientId?: string;
  issuer?: string;
};

export type ConfigKey = (typeof CONFIG_KEYS)[number];
