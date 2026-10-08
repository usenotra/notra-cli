import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { OAUTH_LOGIN_TIMEOUT_MS } from '../constants/auth';
import { OAuthAuthorizationError } from '../lib/workos';
import type { OAuthCallback } from '../types/oauth';

export async function startOAuthCallback(
  state: string,
  preferredRedirectUri?: string,
  timeoutMs = OAUTH_LOGIN_TIMEOUT_MS,
): Promise<OAuthCallback> {
  let preferredPort = 0;
  if (preferredRedirectUri) {
    const url = new URL(preferredRedirectUri);
    if (url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.pathname === '/callback') {
      preferredPort = Number(url.port);
    }
  }
  let resolveCode!: (code: string) => void;
  let rejectCode!: (error: Error) => void;
  const code = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });
  // Registration can fail before the caller starts awaiting the callback.
  void code.catch(() => {});
  let settled = false;
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    let url: URL;
    try {
      url = new URL(request.url ?? '/', 'http://127.0.0.1');
    } catch {
      response.writeHead(400).end('Invalid callback URL.');
      return;
    }
    if (request.method !== 'GET' || url.pathname !== '/callback') {
      response.writeHead(404).end('Not found.');
      return;
    }
    const received = Buffer.from(url.searchParams.get('state') ?? '');
    const expected = Buffer.from(state);
    if (
      url.searchParams.getAll('state').length !== 1 || received.length !== expected.length ||
      !timingSafeEqual(received, expected) || settled
    ) {
      response.writeHead(400).end('Invalid login state. Return to the sign-in page opened by the CLI.');
      return;
    }
    const error = url.searchParams.get('error');
    const authorizationCode = url.searchParams.get('code');
    if (error) {
      settled = true;
      response.writeHead(400).end('Login was not authorized. You can close this tab.');
      rejectCode(new OAuthAuthorizationError(error, 'Login was not authorized. Run `notra auth login` again.'));
    } else if (authorizationCode && url.searchParams.getAll('code').length === 1) {
      settled = true;
      response.end('Authorization received. Return to the terminal to check that login completed.');
      resolveCode(authorizationCode);
    } else {
      response.writeHead(400).end('Missing authorization code.');
    }
  });
  const listen = (port: number) => new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  try {
    await listen(preferredPort);
  } catch (error) {
    if (!preferredPort || !(error instanceof Error) || !('code' in error) || error.code !== 'EADDRINUSE') throw error;
    await listen(0);
  }
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start the local OAuth callback.');
  const timeout = setTimeout(() => {
    settled = true;
    rejectCode(new OAuthAuthorizationError(
      'authorization_timeout',
      'Timed out waiting for browser authorization. Run `notra auth login` again.',
    ));
  }, timeoutMs);
  return {
    redirectUri: `http://127.0.0.1:${address.port}/callback`,
    code,
    close() {
      clearTimeout(timeout);
      server.closeAllConnections();
      server.close();
    },
  };
}
