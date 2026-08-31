import type { CreateGitHubIntegrationRequest } from '@usenotra/sdk/models/operations';
import * as z from 'zod';
import { parseApiRequest } from '../utils/parse-api-request';

const createGitHubIntegrationSchema = z
  .object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    branch: z.string().nullable().optional(),
    token: z.string().nullable().optional(),
  })
  .strict();

export function validateCreateGitHubIntegrationRequest(
  input: unknown,
): CreateGitHubIntegrationRequest {
  return parseApiRequest(
    createGitHubIntegrationSchema,
    input,
    'Invalid GitHub integration request',
  );
}
