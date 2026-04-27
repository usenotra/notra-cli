import {
  ConnectionError,
  ErrorResponse,
  HTTPClientError,
  NotraError,
  RateLimitErrorResponse,
  RequestAbortedError,
  RequestTimeoutError,
  SDKValidationError,
} from '@usenotra/sdk/models/errors';
import { MissingApiKeyError } from '../lib/client';
import { ExitCode } from './exit';

export type FriendlyError = {
  message: string;
  detail?: string;
  exitCode: ExitCode;
};

export function toFriendlyError(err: unknown): FriendlyError {
  if (err instanceof MissingApiKeyError) {
    return { message: err.message, exitCode: ExitCode.Auth };
  }

  if (err instanceof RateLimitErrorResponse) {
    const resetAt = new Date(err.reset * 1000).toISOString();
    return {
      message: `Rate limited (${err.remaining}/${err.limit} remaining).`,
      detail: `Retry after ${resetAt}.`,
      exitCode: ExitCode.RateLimited,
    };
  }

  if (err instanceof ErrorResponse) {
    const inner = unwrapErrorField(err.error);
    return {
      message: inner.message,
      detail: inner.code ? `HTTP ${err.statusCode} (${inner.code})` : `HTTP ${err.statusCode}`,
      exitCode: mapStatus(err.statusCode),
    };
  }

  if (err instanceof NotraError) {
    const parsed = parseJsonBody(err.body);
    return {
      message:
        parsed?.message ?? parsed?.error ?? `Notra API error (HTTP ${err.statusCode}).`,
      detail: parsed?.code
        ? `HTTP ${err.statusCode} (${parsed.code})`
        : `HTTP ${err.statusCode}`,
      exitCode: mapStatus(err.statusCode),
    };
  }

  if (err instanceof RequestTimeoutError || err instanceof RequestAbortedError) {
    return { message: 'Request timed out.', exitCode: ExitCode.Network };
  }

  if (err instanceof ConnectionError) {
    return {
      message: 'Could not reach the Notra API.',
      detail: String(err.cause ?? err.message),
      exitCode: ExitCode.Network,
    };
  }

  if (err instanceof SDKValidationError) {
    return {
      message: 'API returned an unexpected response shape.',
      detail: err.message,
      exitCode: ExitCode.Generic,
    };
  }

  if (err instanceof HTTPClientError) {
    return { message: err.message, exitCode: ExitCode.Network };
  }

  if (err instanceof Error) {
    const oclifExit = readOclifExit(err);
    return {
      message: err.message,
      exitCode: (oclifExit as ExitCode | undefined) ?? ExitCode.Generic,
    };
  }

  return { message: String(err), exitCode: ExitCode.Generic };
}

function readOclifExit(err: Error): number | undefined {
  const oclif = (err as Error & { oclif?: { exit?: number } }).oclif;
  return typeof oclif?.exit === 'number' ? oclif.exit : undefined;
}

function mapStatus(status: number): ExitCode {
  if (status === 401 || status === 403) return ExitCode.Auth;
  if (status === 404) return ExitCode.NotFound;
  if (status === 429) return ExitCode.RateLimited;
  return ExitCode.Generic;
}

function parseJsonBody(
  body: string,
): { message?: string; error?: string; code?: string } | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
  } catch {
    // not JSON
  }
  return undefined;
}

function unwrapErrorField(field: unknown): { message: string; code?: string } {
  if (typeof field === 'string') {
    const parsed = parseJsonBody(field);
    if (parsed?.message) return { message: parsed.message, code: parsed.code };
    return { message: field };
  }
  if (field && typeof field === 'object') {
    const obj = field as { message?: string; code?: string; error?: string };
    return {
      message: obj.message ?? obj.error ?? JSON.stringify(field),
      code: obj.code,
    };
  }
  return { message: 'Unknown API error.' };
}
