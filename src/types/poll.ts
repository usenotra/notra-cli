export type PollOptions<T> = {
  fetch: () => Promise<T>;
  status: (snapshot: T) => string;
  describe?: (snapshot: T) => string;
  intervalMs?: number;
  timeoutMs?: number;
  spinnerLabel?: string;
  spinner?: boolean;
};
