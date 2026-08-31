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
import { GeoApiError } from '../lib/geo-client';
import {
  DeviceAuthorizationError,
  SessionExpiredError,
  TokenRefreshError,
} from '../lib/workos';
import { ExitCode } from '../constants/exit';
import type { FriendlyError } from '../types/errors';

export function toFriendlyError(err: unknown): FriendlyError {
  if (err instanceof MissingApiKeyError || err instanceof SessionExpiredError) {
    return { message: err.message, exitCode: ExitCode.Auth };
  }

  if (err instanceof DeviceAuthorizationError || err instanceof TokenRefreshError) {
    return {
      message: err.message,
      detail: err.code,
      exitCode: ExitCode.Auth,
    };
  }

  if (err instanceof RateLimitErrorResponse) {
    const resetAt = new Date(err.reset * 1000).toISOString();
    return {
      message: `Rate limited (${err.remaining}/${err.limit} remaining).`,
      detail: `Retry after ${resetAt}.`,
      exitCode: ExitCode.RateLimited,
    };
  }

  if (err instanceof GeoApiError) {
    return {
      message: err.message,
      detail: err.code ? `HTTP ${err.statusCode} (${err.code})` : `HTTP ${err.statusCode}`,
      exitCode: mapStatus(err.statusCode),
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

  if (
    err instanceof Error &&
    (err.name === 'TimeoutError' || err.name === 'AbortError')
  ) {
    return { message: 'Request timed out.', exitCode: ExitCode.Network };
  }

  if (err instanceof Error) {
    const oclifExit = readOclifExit(err);
    return {
      message: err.message,
      exitCode: oclifExit ?? ExitCode.Generic,
    };
  }

  return { message: String(err), exitCode: ExitCode.Generic };
}

function readOclifExit(err: Error): number | undefined {
  if (!('oclif' in err) || !isRecord(err.oclif)) return undefined;
  const exit = err.oclif.exit;
  return typeof exit === 'number' ? exit : undefined;
}

function mapStatus(status: number): number {
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
    const parsed: unknown = JSON.parse(body);
    if (!isRecord(parsed)) return undefined;
    return {
      message: readStringProperty(parsed, 'message'),
      error: readStringProperty(parsed, 'error'),
      code: readStringProperty(parsed, 'code'),
    };
  } catch {
    return undefined;
  }
}

function unwrapErrorField(field: unknown): { message: string; code?: string } {
  if (typeof field === 'string') {
    const parsed = parseJsonBody(field);
    if (parsed?.message) return { message: parsed.message, code: parsed.code };
    return { message: field };
  }
  if (isRecord(field)) {
    return {
      message:
        readStringProperty(field, 'message') ??
        readStringProperty(field, 'error') ??
        JSON.stringify(field),
      code: readStringProperty(field, 'code'),
    };
  }
  return { message: 'Unknown API error.' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStringProperty(
  record: Record<string, unknown>,
  property: string,
): string | undefined {
  const value = record[property];
  return typeof value === 'string' ? value : undefined;
}
