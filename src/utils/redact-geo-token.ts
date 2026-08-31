export function redactGeoToken(response: unknown): unknown {
  if (typeof response !== 'object' || response === null || !('token' in response)) {
    return response;
  }
  return { ...response, token: '[redacted]' };
}
