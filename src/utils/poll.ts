import ora, { type Ora } from 'ora';
import type { GenerationStatus } from '../types/api';
import { TERMINAL_GENERATION_STATUSES } from '../types/api';

export type PollOptions<T> = {
  fetch: () => Promise<T>;
  status: (snapshot: T) => GenerationStatus;
  describe?: (snapshot: T) => string;
  intervalMs?: number;
  timeoutMs?: number;
  spinnerLabel?: string;
  spinner?: boolean;
};

export class PollTimeoutError extends Error {
  constructor(elapsedMs: number) {
    super(`Polling timed out after ${Math.round(elapsedMs / 1000)}s.`);
    this.name = 'PollTimeoutError';
  }
}

export async function pollJob<T>(opts: PollOptions<T>): Promise<T> {
  const interval = opts.intervalMs ?? 2000;
  const timeout = opts.timeoutMs ?? 5 * 60 * 1000;
  const useSpinner = opts.spinner ?? Boolean(process.stdout.isTTY);
  const start = Date.now();

  let spinner: Ora | undefined;
  if (useSpinner) {
    spinner = ora({ text: opts.spinnerLabel ?? 'Working…', stream: process.stderr }).start();
  }

  try {
    while (true) {
      const snapshot = await opts.fetch();
      const status = opts.status(snapshot);
      if (spinner && opts.describe) spinner.text = opts.describe(snapshot);
      if (TERMINAL_GENERATION_STATUSES.has(status)) {
        if (spinner) {
          if (status === 'completed') spinner.succeed(opts.describe?.(snapshot));
          else spinner.fail(opts.describe?.(snapshot));
        }
        return snapshot;
      }
      if (Date.now() - start > timeout) {
        spinner?.fail('Timed out');
        throw new PollTimeoutError(Date.now() - start);
      }
      await sleep(interval);
    }
  } catch (err) {
    spinner?.stop();
    throw err;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
