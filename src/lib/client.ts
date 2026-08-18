import { Notra } from '@usenotra/sdk';
import { getApiKey, getBaseUrl, getStoredAuth } from './config';

export type ClientOverrides = {
  apiKey?: string;
  baseUrl?: string;
};

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'Not signed in. Run `notra auth login`, set `NOTRA_API_KEY`, or pass `--api-key`.',
    );
    this.name = 'MissingApiKeyError';
  }
}

export function resolveBearerToken(overrides: ClientOverrides = {}): string | undefined {
  return (
    overrides.apiKey ??
    process.env.NOTRA_API_KEY ??
    getStoredAuth()?.accessToken ??
    getApiKey()
  );
}

export function buildClient(overrides: ClientOverrides = {}): Notra {
  const bearer = resolveBearerToken(overrides);
  if (!bearer) throw new MissingApiKeyError();
  const serverURL = overrides.baseUrl ?? getBaseUrl();
  return new Notra({
    bearerAuth: bearer,
    serverURL,
    userAgent: `notra-cli/${process.env.npm_package_version ?? 'dev'}`,
  });
}
