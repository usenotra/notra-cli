import { MissingApiKeyError } from '../lib/client';
import { ApiConnectionError, ApiError } from '../lib/http-client';
import {
  DeviceAuthorizationError,
  SessionExpiredError,
  TokenRefreshError,
} from '../lib/workos';
import { ExitCode } from '../constants/exit';
import type { FriendlyError } from '../types/errors';
import { ApiResponseDecodeError } from './parse-api-response';

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

  if (err instanceof ApiError) {
    const status = err.code ? `HTTP ${err.statusCode} (${err.code})` : `HTTP ${err.statusCode}`;
    return {
      message: err.message,
      detail: err.retryAfter ? `${status}; retry after ${err.retryAfter}` : status,
      exitCode: mapStatus(err.statusCode),
    };
  }

  if (err instanceof ApiConnectionError) {
    return {
      message: 'Could not reach the Notra API.',
      detail: String(err.cause ?? err.message),
      exitCode: ExitCode.Network,
    };
  }

  if (err instanceof ApiResponseDecodeError) {
    return {
      message: err.message,
      detail: err.issues.join('; '),
      exitCode: ExitCode.Generic,
    };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
