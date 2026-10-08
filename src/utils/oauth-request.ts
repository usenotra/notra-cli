import { AUTH_REQUEST_TIMEOUT_MS } from '../constants/auth';
import { OAuthConnectionError } from '../lib/oauth-errors';

export async function fetchOAuthJson(url: string, init: RequestInit) {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });
    const body: unknown = await response.json();
    return { response, body };
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The OAuth server returned invalid JSON.');
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw error;
    throw new OAuthConnectionError(error);
  }
}
