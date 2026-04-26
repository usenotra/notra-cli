export const ExitCode = {
  Ok: 0,
  Generic: 1,
  Usage: 2,
  Auth: 3,
  RateLimited: 4,
  NotFound: 5,
  Network: 6,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];
