import { createHash, randomBytes } from 'node:crypto';

export function createCliAuthSession(): {
  sessionId: string;
  pollSecret: string;
  pollSecretHash: string;
} {
  const sessionId = randomBytes(32).toString('base64url');
  const pollSecret = randomBytes(32).toString('base64url');
  const pollSecretHash = createHash('sha256').update(pollSecret).digest('base64url');

  return { sessionId, pollSecret, pollSecretHash };
}
