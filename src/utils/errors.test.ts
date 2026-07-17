import { describe, expect, test } from 'bun:test';
import { toFriendlyError } from './errors';
import { ExitCode } from './exit';

describe('toFriendlyError', () => {
  test.each(['TimeoutError', 'AbortError'])(
    'maps %s fetch failures to the network exit code',
    (name) => {
      const error = new Error('The operation timed out');
      error.name = name;

      expect(toFriendlyError(error)).toEqual({
        message: 'Request timed out.',
        exitCode: ExitCode.Network,
      });
    },
  );
});
