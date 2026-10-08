import type {
  ApiClientOptions,
  ApiHttpMethod,
  ApiRequestOptions,
  DecodedApiRequestOptions,
} from '../types/http';
import { isRecord } from '../utils/records';

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
    const response = await this.fetchResponse(method, path, options);
    const text = await this.transfer(() => response.text());
    const payload = parseResponse(text);
    assertResponseOk(response, payload);
    return options.decode ? options.decode(payload) : payload;
  }

  async *stream(method: ApiHttpMethod, path: string, options: ApiRequestOptions = {}): AsyncGenerator<unknown> {
    const response = await this.fetchResponse(method, path, options);
    if (!response.ok) assertResponseOk(response, parseResponse(await this.transfer(() => response.text())));
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    try {
      while (true) {
        const { value, done } = await this.transfer(() => reader.read());
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines) {
          if (line.trim()) yield parseResponse(line.trim());
        }
        if (done) break;
      }
      if (pending.trim()) yield parseResponse(pending.trim());
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }

  private async fetchResponse(method: ApiHttpMethod, path: string, options: ApiRequestOptions): Promise<Response> {
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

    const body = options.body === undefined ? undefined : JSON.stringify(options.body);
    const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    return this.transfer(() => fetch(url, {
      method,
      headers,
      body,
      signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    }));
  }

  // Keep network classification at the I/O boundary. API status errors and
  // decoder failures must not be mistaken for connection failures.
  private async transfer<Output>(operation: () => Promise<Output>): Promise<Output> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw error;
      throw new ApiConnectionError(`Could not reach the Notra API: ${String(error)}`, {
        cause: error,
      });
    }
  }
}

function assertResponseOk(response: Response, payload: unknown): void {
  if (!response.ok) {
    const details = readErrorDetails(payload);
    throw new ApiError(
      details.message ?? `Notra API error (HTTP ${response.status}).`,
      response.status,
      details.code,
      response.headers.get('retry-after') ?? undefined,
    );
  }
}

function appendQuery(url: URL, query: ApiRequestOptions['query']): void {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      url.searchParams.set(key, value.map(String).join(','));
      continue;
    }
    url.searchParams.set(key, String(value));
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
