import type { Schema } from 'conf';
import type { ConfigSchema } from '../types/config';

export const CONFIG_SCHEMA = {
  apiKey: { type: 'string' },
  baseUrl: { type: 'string', format: 'uri' },
  accessToken: { type: 'string' },
  refreshToken: { type: 'string' },
  accessTokenExpiresAt: { type: 'number' },
  organizationId: { type: 'string' },
  authClientId: { type: 'string' },
  authIssuer: { type: 'string', format: 'uri' },
  oauthClientId: { type: 'string' },
  oauthIssuer: { type: 'string', format: 'uri' },
  oauthRedirectUri: { type: 'string', format: 'uri' },
} satisfies Schema<ConfigSchema>;
