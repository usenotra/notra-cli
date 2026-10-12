import { MissingApiKeyError } from '../lib/client';
import { ApiConnectionError, ApiError } from '../lib/http-client';
import {
  OAuthAuthorizationError,
  SessionExpiredError,
  TokenRefreshError,
} from '../lib/workos';
import { ExitCode } from '../constants/exit';
import {
  ORGANIZATION_SELECTION_REQUIRED_PREFIX,
  WORKSPACE_ACCESS_REVOKED_PREFIX,
} from '../constants/http';
import { WORKSPACE_SELECTION_HINT } from '../constants/workspaces';
import type { FriendlyError } from '../types/errors';
import { ApiResponseDecodeError } from './parse-api-response';
import { OAuthConnectionError } from '../lib/oauth-errors';
import { sanitizeTerminalText } from './output';

export function toFriendlyError(err: unknown): FriendlyError {
  if (err instanceof OAuthConnectionError) {
    const cause = err.cause instanceof Error && err.cause.cause instanceof Error
      ? err.cause.cause : err.cause;
    return {
      message: err.message,
      detail: cause instanceof Error ? sanitizeTerminalText(String(cause)) : undefined,
      exitCode: ExitCode.Network,
    };
  }
  if (err instanceof MissingApiKeyError || err instanceof SessionExpiredError) {
    return { message: err.message, exitCode: ExitCode.Auth };
  }

  if (err instanceof OAuthAuthorizationError || err instanceof TokenRefreshError) {
    return {
      message: err.message,
      detail: err.code,
      exitCode: ExitCode.Auth,
    };
  }

  if (err instanceof ApiError) {
    const workspaceError = toWorkspaceSelectionError(err);
    if (workspaceError) return workspaceError;
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

function toWorkspaceSelectionError(err: ApiError): FriendlyError | undefined {
  if (err.statusCode !== 403) return undefined;
  const message = err.message.trim().toLowerCase();
  if (message.startsWith(ORGANIZATION_SELECTION_REQUIRED_PREFIX)) {
    return {
      message: 'This API key works in several workspaces. Choose the workspace to act on.',
      detail: `HTTP 403. ${WORKSPACE_SELECTION_HINT}`,
      exitCode: ExitCode.Auth,
    };
  }
  if (message.startsWith(WORKSPACE_ACCESS_REVOKED_PREFIX)) {
    return {
      message: 'Your credentials no longer have access to the selected workspace.',
      detail: `HTTP 403. ${WORKSPACE_SELECTION_HINT}`,
      exitCode: ExitCode.Auth,
    };
  }
  return undefined;
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
