export type QueryValue =
  | string
  | number
  | boolean
  | ReadonlyArray<string | number | boolean>;

export type ApiRequestOptions = {
  query?: Record<string, QueryValue | undefined>;
  body?: unknown;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export type DecodedApiRequestOptions<Output> = ApiRequestOptions & {
  decode: (value: unknown) => Output;
};

export type ApiClientOptions = {
  apiKey?: string;
  baseUrl: string;
  userAgent?: string;
};
export type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
