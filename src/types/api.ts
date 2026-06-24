import * as z from 'zod';
import type {
  CreateBrandIdentityRequest,
  CreateGitHubIntegrationRequest,
  CreatePostGenerationRequest,
  CreateScheduleRequest,
  UpdateBrandIdentityRequest,
  UpdatePostRequest,
  UpdateScheduleRequest,
} from '@usenotra/sdk/models/operations';

// Re-export commonly used SDK types so command files don't reach into the SDK
// internals directly. Keeps the import surface small and easy to swap.
export type {
  ListPostsRequest,
  ListPostsResponse,
  ListPostsPost,
} from '@usenotra/sdk/models/operations';

export type {
  GetPostResponse,
} from '@usenotra/sdk/models/operations';

export type {
  UpdatePostRequest,
  UpdatePostResponse,
} from '@usenotra/sdk/models/operations';

export type {
  DeletePostResponse,
} from '@usenotra/sdk/models/operations';

export type {
  CreatePostGenerationRequest,
  CreatePostGenerationResponse,
  GetPostGenerationResponse,
} from '@usenotra/sdk/models/operations';

export type {
  ListBrandIdentitiesResponse,
  ListBrandIdentitiesBrandIdentity,
  GetBrandIdentityResponse,
  CreateBrandIdentityRequest,
  CreateBrandIdentityResponse,
  GetBrandIdentityGenerationResponse,
  UpdateBrandIdentityRequest,
  UpdateBrandIdentityResponse,
  DeleteBrandIdentityResponse,
} from '@usenotra/sdk/models/operations';

export type {
  ListIntegrationsResponse,
  CreateGitHubIntegrationRequest,
  CreateGitHubIntegrationResponse,
  DeleteIntegrationResponse,
} from '@usenotra/sdk/models/operations';

export type {
  ListSchedulesResponse,
  CreateScheduleRequest,
  CreateScheduleResponse,
  UpdateScheduleRequest,
  UpdateScheduleResponse,
  DeleteScheduleResponse,
} from '@usenotra/sdk/models/operations';

export type GenerationStatus = 'queued' | 'running' | 'completed' | 'failed';

export const TERMINAL_GENERATION_STATUSES: ReadonlySet<GenerationStatus> = new Set([
  'completed',
  'failed',
]);

const contentTypeSchema = z.enum(['changelog', 'blog_post', 'linkedin_post', 'twitter_post']);
const lookbackWindowSchema = z.enum([
  'current_day',
  'yesterday',
  'last_7_days',
  'last_14_days',
  'last_30_days',
]);
const scheduleFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);
const publishDestinationSchema = z.enum(['webflow', 'framer', 'custom']);

const scheduleCronSchema = z
  .object({
    frequency: scheduleFrequencySchema,
    hour: z.int().min(0).max(23),
    minute: z.int().min(0).max(59),
    dayOfWeek: z.int().min(0).max(6).optional(),
    dayOfMonth: z.int().min(1).max(31).optional(),
  })
  .strict()
  .superRefine((cron, ctx) => {
    if (cron.frequency === 'weekly' && cron.dayOfWeek === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfWeek'],
        message: 'dayOfWeek is required for weekly schedules.',
      });
    }
    if (cron.frequency === 'monthly' && cron.dayOfMonth === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfMonth'],
        message: 'dayOfMonth is required for monthly schedules.',
      });
    }
  });

const scheduleBodySchema = z
  .object({
    name: z.string().min(1),
    sourceType: z.literal('cron'),
    sourceConfig: z.object({ cron: scheduleCronSchema }).strict(),
    targets: z.object({ repositoryIds: z.array(z.string().min(1)).min(1) }).strict(),
    outputType: contentTypeSchema,
    outputConfig: z
      .object({
        publishDestination: publishDestinationSchema.optional(),
        brandVoiceId: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    enabled: z.boolean(),
    autoPublish: z.boolean().optional(),
    lookbackWindow: lookbackWindowSchema.optional(),
  })
  .strict();

const createPostGenerationSchema = z
  .object({
    contentType: contentTypeSchema,
    lookbackWindow: lookbackWindowSchema.optional(),
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
        repositories: z.array(z.object({ owner: z.string().min(1), repo: z.string().min(1) }).strict()),
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
          .array(z.union([z.object({ repositoryId: z.string().min(1), tagName: z.string().min(1) }).strict(), z.string().min(1)]))
          .optional(),
        linearIssueIds: z
          .array(z.object({ integrationId: z.string().min(1), issueId: z.string().min(1) }).strict())
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
    status: z.enum(['draft', 'published']).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one post field is required.');

const createBrandIdentitySchema = z
  .object({
    name: z.string().min(1).optional(),
    websiteUrl: z.url(),
  })
  .strict();

const updateBrandIdentityBodySchema = z
  .object({
    name: z.string().optional(),
    websiteUrl: z.url().optional(),
    companyName: z.string().nullable().optional(),
    companyDescription: z.string().nullable().optional(),
    toneProfile: z.enum(['Conversational', 'Professional', 'Casual', 'Formal']).nullable().optional(),
    customTone: z.string().nullable().optional(),
    customInstructions: z.string().nullable().optional(),
    audience: z.string().nullable().optional(),
    language: z
      .enum([
        'English',
        'Spanish',
        'French',
        'German',
        'Portuguese',
        'Dutch',
        'Italian',
        'Japanese',
        'Korean',
        'Chinese',
        'Arabic',
        'Hindi',
        'Russian',
        'Turkish',
        'Polish',
        'Swedish',
        'Danish',
        'Norwegian',
        'Finnish',
        'Czech',
        'Romanian',
        'Hungarian',
        'Greek',
        'Thai',
        'Vietnamese',
        'Indonesian',
        'Ukrainian',
        'Hebrew',
      ])
      .nullable()
      .optional(),
    isDefault: z.literal(true).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one brand identity field is required.');

const createGitHubIntegrationSchema = z
  .object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    branch: z.string().nullable().optional(),
    token: z.string().nullable().optional(),
  })
  .strict();

export function validateCreateScheduleRequest(input: unknown): CreateScheduleRequest {
  return parseApiRequest(scheduleBodySchema, input, 'Invalid schedule create request');
}

export function validateUpdateScheduleBody(input: unknown): UpdateScheduleRequest['body'] {
  return parseApiRequest(scheduleBodySchema, input, 'Invalid schedule update request');
}

export function validateCreatePostGenerationRequest(input: unknown): CreatePostGenerationRequest {
  return parseApiRequest(createPostGenerationSchema, input, 'Invalid post generation request');
}

export function validateUpdatePostBody(input: unknown): UpdatePostRequest['body'] {
  return parseApiRequest(updatePostBodySchema, input, 'Invalid post update request');
}

export function validateCreateBrandIdentityRequest(input: unknown): CreateBrandIdentityRequest {
  return parseApiRequest(createBrandIdentitySchema, input, 'Invalid brand identity generation request');
}

export function validateUpdateBrandIdentityBody(input: unknown): UpdateBrandIdentityRequest['body'] {
  return parseApiRequest(updateBrandIdentityBodySchema, input, 'Invalid brand identity update request');
}

export function validateCreateGitHubIntegrationRequest(input: unknown): CreateGitHubIntegrationRequest {
  return parseApiRequest(createGitHubIntegrationSchema, input, 'Invalid GitHub integration request');
}

function parseApiRequest<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;
  throw new Error(`${label}:\n${formatZodError(parsed.error)}`);
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'body';
      return `- ${path}: ${issue.message}`;
    })
    .join('\n');
}
