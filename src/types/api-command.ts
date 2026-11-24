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
  // Skip the selected-workspace header, e.g. so a stale selection cannot block discovery.
  unscoped?: boolean;
  response?: 'json' | 'chat' | 'ndjson';
  // Ask before irreversible actions that are neither DELETE nor billable;
  // false skips the question for a DELETE that only undoes something.
  // Billable actions always ask.
  confirm?: boolean;
  bodySchema?: ZodObject;
  // Human-readable output for a terminal; JSON is printed otherwise.
  render?: (result: unknown) => string;
  // Adds --watch: re-read until the result is completed or failed.
  watch?: {
    status: (result: unknown) => WatchStatus;
    describe: (result: unknown) => string;
  };
};

export type WatchStatus = 'completed' | 'failed' | 'running';

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
