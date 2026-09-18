import type {
  CreatePostGenerationRequest,
  GetPostGenerationResponse,
  ListPostsResponse,
  Post,
  PostGenerationCreatedResponse,
  PostMutationResponse,
  PostResponse,
  UpdatePostBody,
} from "../types/posts";
import * as z from "zod";
import {
  CONTENT_TYPES,
  LOOKBACK_WINDOWS,
  POST_STATUSES,
} from "../constants/posts";
import { parseApiRequest } from "../utils/parse-api-request";
import { deletionResponseSchema, organizationSchema } from "./common";

const postSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string().nullable(),
    content: z.string(),
    htmlUrl: z.string().nullable(),
    markdown: z.string().nullable(),
    rawHtml: z.string().nullable(),
    recommendations: z.string().nullable(),
    contentType: z.string(),
    sourceMetadata: z.unknown().nullable(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<Post>;

const postGenerationJobSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    status: z.string(),
    contentType: z.string(),
    lookbackWindow: z.string(),
    repositoryIds: z.array(z.string()),
    brandVoiceId: z.string().nullable(),
    workflowRunId: z.string().nullable(),
    postId: z.string().nullable(),
    error: z.string().nullable(),
    source: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().nullable(),
  })
  .passthrough();

const postGenerationEventSchema = z
  .object({
    id: z.string(),
    jobId: z.string(),
    type: z.string(),
    message: z.string(),
    createdAt: z.string(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
  })
  .passthrough();

export const listPostsResponseSchema = z
  .object({
    organization: organizationSchema,
    posts: z.array(postSchema),
    pagination: z
      .object({
        limit: z.number(),
        currentPage: z.number(),
        nextPage: z.number().nullable(),
        previousPage: z.number().nullable(),
        totalPages: z.number(),
        totalItems: z.number(),
      })
      .passthrough(),
  })
  .passthrough() satisfies z.ZodType<ListPostsResponse>;

export const postResponseSchema = z
  .object({
    organization: organizationSchema,
    post: postSchema.nullable(),
  })
  .passthrough() satisfies z.ZodType<PostResponse>;
export const postMutationResponseSchema = z
  .object({
    organization: organizationSchema,
    post: postSchema,
  })
  .passthrough() satisfies z.ZodType<PostMutationResponse>;
export const postDeleteResponseSchema = deletionResponseSchema;
export const postGenerationCreatedResponseSchema = z
  .object({
    organization: organizationSchema,
    job: postGenerationJobSchema,
  })
  .passthrough() satisfies z.ZodType<PostGenerationCreatedResponse>;
export const postGenerationResponseSchema = z
  .object({
    job: postGenerationJobSchema,
    events: z.array(postGenerationEventSchema),
  })
  .passthrough() satisfies z.ZodType<GetPostGenerationResponse>;

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
          z
            .object({ owner: z.string().min(1), repo: z.string().min(1) })
            .strict(),
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
          .array(
            z
              .object({ repositoryId: z.string().min(1), number: z.int() })
              .strict(),
          )
          .optional(),
        releaseTagNames: z
          .array(
            z.union([
              z
                .object({
                  repositoryId: z.string().min(1),
                  tagName: z.string().min(1),
                })
                .strict(),
              z.string().min(1),
            ]),
          )
          .optional(),
        linearIssueIds: z
          .array(
            z
              .object({
                integrationId: z.string().min(1),
                issueId: z.string().min(1),
              })
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
  .refine(
    (body) => Object.keys(body).length > 0,
    "At least one post field is required.",
  );

export function validateCreatePostGenerationRequest(
  input: unknown,
): CreatePostGenerationRequest {
  return parseApiRequest(
    createPostGenerationSchema,
    input,
    "Invalid post generation request",
  );
}

export function validateUpdatePostBody(input: unknown): UpdatePostBody {
  return parseApiRequest(
    updatePostBodySchema,
    input,
    "Invalid post update request",
  );
}
