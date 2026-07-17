import { createHash, randomBytes } from 'node:crypto';
import { AUTH_VERIFICATION_CODE_BYTES } from '../constants/auth';

export function createCliAuthSession(): {
  sessionId: string;
  pollSecret: string;
  pollSecretHash: string;
  verificationCode: string;
} {
  const sessionId = randomBytes(32).toString('base64url');
  const pollSecret = randomBytes(32).toString('base64url');
  const pollSecretHash = createHash('sha256').update(pollSecret).digest('base64url');
  const verificationCodeValue = createHash('sha256')
    .update(`notra-cli-verification:${pollSecretHash}`)
    .digest('hex')
    .slice(0, AUTH_VERIFICATION_CODE_BYTES * 2)
    .toUpperCase();
  const verificationCode = `${verificationCodeValue.slice(0, 4)}-${verificationCodeValue.slice(4)}`;

  return { sessionId, pollSecret, pollSecretHash, verificationCode };
}
