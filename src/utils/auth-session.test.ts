import { createHash } from 'node:crypto';
import { describe, expect, test } from 'bun:test';
import { AUTH_VERIFICATION_CODE_PATTERN } from '../constants/auth';
import { createCliAuthSession } from './auth-session';

describe('createCliAuthSession', () => {
  test('creates independent high-entropy session and polling secrets', () => {
    const first = createCliAuthSession();
    const second = createCliAuthSession();

    expect(first.sessionId).toHaveLength(43);
    expect(first.pollSecret).toHaveLength(43);
    expect(first.pollSecretHash).toHaveLength(43);
    expect(first.pollSecretHash).toBe(
      createHash('sha256').update(first.pollSecret).digest('base64url'),
    );
    expect(first.verificationCode).toMatch(AUTH_VERIFICATION_CODE_PATTERN);
    expect(first.pollSecret).not.toBe(first.sessionId);
    expect(first.sessionId).not.toBe(second.sessionId);
    expect(first.pollSecret).not.toBe(second.pollSecret);
  });
});
