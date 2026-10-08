import type { ApiHttpMethod } from '../types/http';

export const OPENAPI_HTTP_METHODS: Readonly<Record<string, ApiHttpMethod>> = {
  get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE',
};
