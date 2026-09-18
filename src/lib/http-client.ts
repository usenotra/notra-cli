import type {
  ApiClientOptions,
  ApiHttpMethod,
  ApiRequestOptions,
  DecodedApiRequestOptions,
  QueryValue,
} from '../types/http';

const DEFAULT_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code?: string,
    readonly retryAfter?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiConnectionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiConnectionError';
  }
}

export class HttpClient {
  constructor(private readonly options: ApiClientOptions) {}

  request<Output>(
    method: ApiHttpMethod,
    path: string,
    options: DecodedApiRequestOptions<Output>,
  ): Promise<Output>;

  request(
    method: ApiHttpMethod,
    path: string,
    options?: ApiRequestOptions,
  ): Promise<unknown>;

  async request(
    method: ApiHttpMethod,
    path: string,
    options: ApiRequestOptions & { decode?: (value: unknown) => unknown } = {},
  ): Promise<unknown> {
    const baseUrl = new URL(`${this.options.baseUrl.replace(/\/$/, '')}/`);
    const url = new URL(path.replace(/^\/+/, ''), baseUrl);
    if (url.origin !== baseUrl.origin) {
      throw new Error('API request path must resolve to the configured Notra API origin.');
    }
    appendQuery(url, options.query);
    const headers = new Headers({ Accept: 'application/json', ...options.headers });
    if (this.options.apiKey) headers.set('Authorization', `Bearer ${this.options.apiKey}`);
    if (this.options.userAgent) headers.set('User-Agent', this.options.userAgent);
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
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw error;
      throw new ApiConnectionError(`Could not reach the Notra API: ${String(error)}`, {
        cause: error,
      });
    }

    const text = await response.text();
    const payload = parseResponse(text);
    if (!response.ok) {
      const details = readErrorDetails(payload);
      throw new ApiError(
        details.message ?? `Notra API error (HTTP ${response.status}).`,
        response.status,
        details.code,
        response.headers.get('retry-after') ?? undefined,
      );
    }
    return options.decode ? options.decode(payload) : payload;
  }
}

function appendQuery(url: URL, query: ApiRequestOptions['query']): void {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      url.searchParams.set(key, value.map(String).join(','));
      continue;
    }
    url.searchParams.set(key, String(value as Exclude<QueryValue, ReadonlyArray<unknown>>));
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

function readErrorDetails(value: unknown): { message?: string; code?: string } {
  if (typeof value === 'string') return { message: value };
  if (!isRecord(value)) return {};
  const error = value.error;
  if (isRecord(error)) {
    return {
      message: readString(error, 'message') ?? JSON.stringify(error),
      code: readString(error, 'code'),
    };
  }
  return {
    message: readString(value, 'message') ?? (typeof error === 'string' ? error : undefined),
    code: readString(value, 'code'),
  };
}

function readString(value: Record<string, unknown>, key: string): string | undefined {
  return typeof value[key] === 'string' ? value[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
