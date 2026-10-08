import type { OpenApiOperation } from './openapi';
import type { JSONSchema } from 'zod/v4/core';
import type { ZodObject } from 'zod';
import type { QueryValue } from './http';

export type OperationRequestSchema = {
  parameters: Record<string, JSONSchema.JSONSchema>;
  body?: JSONSchema.JSONSchema;
};

export type ApiCommandOptions = {
  description?: string;
  defaults?: Record<string, QueryValue>;
  public?: boolean;
  response?: 'json' | 'chat' | 'ndjson';
  bodySchema?: ZodObject;
};

export type PreparedOperation = {
  path: string;
  query: Record<string, QueryValue>;
  headers: Record<string, string>;
  body?: unknown;
};

export type OperationWithSchema = {
  operation: OpenApiOperation;
  schema: OperationRequestSchema;
};
