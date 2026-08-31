import { Errors } from '@oclif/core';
import * as z from 'zod';
import { ExitCode } from '../constants/exit';

export function parseApiRequest<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;
  throw new Errors.CLIError(`${label}:\n${formatZodError(parsed.error)}`, {
    exit: ExitCode.Usage,
  });
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'body';
      return `- ${path}: ${issue.message}`;
    })
    .join('\n');
}
