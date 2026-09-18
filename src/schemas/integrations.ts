import type {
  CreateGitHubIntegrationRequest,
  GitHubIntegrationResponse,
  IntegrationsResponse,
} from "../types/integrations";
import * as z from "zod";
import { parseApiRequest } from "../utils/parse-api-request";
import { cascadingDeletionResponseSchema, organizationSchema } from "./common";

const integrationSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    owner: z.string().nullable().optional(),
    repo: z.string().nullable().optional(),
    linearTeamName: z.string().nullable().optional(),
    linearOrganizationName: z.string().nullable().optional(),
  })
  .passthrough();

export const integrationsResponseSchema = z
  .object({
    github: z.array(integrationSchema),
    linear: z.array(integrationSchema),
    slack: z.array(z.unknown()),
    organization: organizationSchema,
  })
  .passthrough() satisfies z.ZodType<IntegrationsResponse>;
export const githubIntegrationResponseSchema = z
  .object({
    github: integrationSchema,
    organization: organizationSchema,
  })
  .passthrough() satisfies z.ZodType<GitHubIntegrationResponse>;
export const integrationDeleteResponseSchema = cascadingDeletionResponseSchema;

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
    "Invalid GitHub integration request",
  );
}
