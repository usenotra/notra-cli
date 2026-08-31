import type {
  GeoClientOptions,
  GeoHttpMethod,
  GeoRequestOptions,
} from '../types/geo';

const DEFAULT_TIMEOUT_MS = 30_000;

export class GeoApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code?: string,
    readonly retryAfter?: string,
  ) {
    super(message);
    this.name = 'GeoApiError';
  }
}

export class GeoClient {
  constructor(private readonly options: GeoClientOptions) {}

  async request<T = unknown>(
    method: GeoHttpMethod,
    path: string,
    options: GeoRequestOptions = {},
  ): Promise<T> {
    const url = new URL(path, `${this.options.baseUrl.replace(/\/$/, '')}/`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers = new Headers({ Accept: 'application/json' });
    if (this.options.apiKey) headers.set('Authorization', `Bearer ${this.options.apiKey}`);
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') throw error;
      throw new Error(`Could not reach the Notra API: ${String(error)}`, { cause: error });
    }

    const text = await response.text();
    const payload = parseResponse(text);
    if (!response.ok) {
      const error = readString(payload, 'error') ?? readString(payload, 'message');
      throw new GeoApiError(
        error ?? `Notra API error (HTTP ${response.status}).`,
        response.status,
        readString(payload, 'code'),
        response.headers.get('retry-after') ?? undefined,
      );
    }
    return payload as T;
  }
}

function parseResponse(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readString(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
  const property = (value as Record<string, unknown>)[key];
  return typeof property === 'string' ? property : undefined;
}
