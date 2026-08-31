import type {
  CreatePostGenerationRequest,
  UpdatePostRequest,
} from '@usenotra/sdk/models/operations';
import * as z from 'zod';
import { CONTENT_TYPES, LOOKBACK_WINDOWS, POST_STATUSES } from '../constants/posts';
import { parseApiRequest } from '../utils/parse-api-request';

const createPostGenerationSchema = z
  .object({
    contentType: z.enum(CONTENT_TYPES),
    lookbackWindow: z.enum(LOOKBACK_WINDOWS).optional(),
    brandVoiceId: z.string().min(1).optional(),
    brandIdentityId: z.string().min(1).nullable().optional(),
    repositoryIds: z.array(z.string().min(1)).optional(),
    linearIntegrationIds: z.array(z.string().min(1)).optional(),
    integrations: z
      .object({
        github: z.array(z.string().min(1)).optional(),
        linear: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    github: z
      .object({
        repositories: z.array(
          z.object({ owner: z.string().min(1), repo: z.string().min(1) }).strict(),
        ),
      })
      .strict()
      .optional(),
    dataPoints: z
      .object({
        includePullRequests: z.boolean().optional(),
        includeCommits: z.boolean().optional(),
        includeReleases: z.boolean().optional(),
        includeLinearData: z.boolean().optional(),
      })
      .strict()
      .optional(),
    selectedItems: z
      .object({
        commitShas: z.array(z.string().min(1)).optional(),
        pullRequestNumbers: z
          .array(z.object({ repositoryId: z.string().min(1), number: z.int() }).strict())
          .optional(),
        releaseTagNames: z
          .array(
            z.union([
              z
                .object({ repositoryId: z.string().min(1), tagName: z.string().min(1) })
                .strict(),
              z.string().min(1),
            ]),
          )
          .optional(),
        linearIssueIds: z
          .array(
            z
              .object({ integrationId: z.string().min(1), issueId: z.string().min(1) })
              .strict(),
          )
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const updatePostBodySchema = z
  .object({
    title: z.string().optional(),
    slug: z.string().nullable().optional(),
    markdown: z.string().optional(),
    status: z.enum(POST_STATUSES).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one post field is required.');

export function validateCreatePostGenerationRequest(
  input: unknown,
): CreatePostGenerationRequest {
  return parseApiRequest(
    createPostGenerationSchema,
    input,
    'Invalid post generation request',
  );
}

export function validateUpdatePostBody(input: unknown): UpdatePostRequest['body'] {
  return parseApiRequest(updatePostBodySchema, input, 'Invalid post update request');
}
