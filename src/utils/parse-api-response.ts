import type * as z from 'zod';

export class ApiResponseDecodeError extends Error {
  constructor(label: string, readonly issues: ReadonlyArray<string>) {
    super(`The Notra API returned an invalid ${label}.`);
    this.name = 'ApiResponseDecodeError';
  }
}

export function apiResponseDecoder<Output>(
  schema: z.ZodType<Output>,
  label: string,
): (value: unknown) => Output {
  return (value) => {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    throw new ApiResponseDecodeError(
      label,
      result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'response';
        return `${path}: ${issue.message}`;
      }),
    );
  };
}
