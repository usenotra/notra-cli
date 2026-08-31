import type { Schema } from 'conf';
import type { ConfigSchema } from '../types/config';

export const CONFIG_SCHEMA = {
  apiKey: { type: 'string' },
  baseUrl: { type: 'string', format: 'uri' },
  accessToken: { type: 'string' },
  refreshToken: { type: 'string' },
  accessTokenExpiresAt: { type: 'number' },
  organizationId: { type: 'string' },
} satisfies Schema<ConfigSchema>;
