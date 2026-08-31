export type GeoHttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export type GeoQueryValue = boolean | number | string | undefined;

export type GeoRequestOptions = {
  body?: unknown;
  query?: Record<string, GeoQueryValue>;
  timeoutMs?: number;
};

export type GeoClientOptions = {
  apiKey?: string;
  baseUrl: string;
};
