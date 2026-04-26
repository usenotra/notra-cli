import { Notra } from '@usenotra/sdk';
import { getApiKey, getBaseUrl } from './config';

export type ClientOverrides = {
  apiKey?: string;
  baseUrl?: string;
};

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'No Notra API key configured. Run `notra init`, set `NOTRA_API_KEY`, or pass `--api-key`.',
    );
    this.name = 'MissingApiKeyError';
  }
}

export function buildClient(overrides: ClientOverrides = {}): Notra {
  const apiKey = overrides.apiKey ?? getApiKey();
  if (!apiKey) throw new MissingApiKeyError();
  const serverURL = overrides.baseUrl ?? getBaseUrl();
  return new Notra({
    bearerAuth: apiKey,
    serverURL,
    userAgent: `notra-cli/${process.env.npm_package_version ?? 'dev'}`,
  });
}
