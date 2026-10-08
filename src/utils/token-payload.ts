export function readTokenPayload(accessToken: string): Record<string, unknown> | undefined {
  const segment = accessToken.split('.')[1];
  if (!segment) return undefined;
  try {
    const payload: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}
