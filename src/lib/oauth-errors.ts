export class OAuthConnectionError extends Error {
  constructor(cause: unknown) {
    super('Could not reach the Notra OAuth server.', { cause });
    this.name = 'OAuthConnectionError';
  }
}
