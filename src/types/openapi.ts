import type { ApiHttpMethod } from './http';

export type OpenApiOperation = {
  id: string;
  method: ApiHttpMethod;
  path: string;
  summary: string;
  tag: string;
  parameters: ReadonlyArray<{
    name: string;
    in: 'path' | 'query' | 'header';
    required: boolean;
  }>;
  hasBody: boolean;
};
