import type { Organization, Pagination } from "./common";

export type Post = {
  id: string;
  title: string;
  slug: string | null;
  content: string;
  htmlUrl: string | null;
  markdown: string | null;
  rawHtml: string | null;
  recommendations: string | null;
  contentType: string;
  sourceMetadata: unknown | null;
  status: "draft" | "published" | (string & {});
  createdAt: string;
  updatedAt: string;
};

export type ListPostsRequest = {
  sort?: "asc" | "desc";
  limit?: number;
  page?: number;
  status?: string;
  contentType?: string;
  brandIdentityId?: string;
};
export type ListPostsResponse = {
  organization: Organization;
  posts: Post[];
  pagination: Pagination;
};
export type PostResponse = { organization: Organization; post: Post | null };
export type PostMutationResponse = { organization: Organization; post: Post };

export type PostGenerationEvent = {
  id: string;
  jobId: string;
  type: string;
  message: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};
export type PostGenerationJob = {
  id: string;
  organizationId: string;
  status: "queued" | "running" | "completed" | "failed" | (string & {});
  contentType: string;
  lookbackWindow: string;
  repositoryIds: string[];
  brandVoiceId: string | null;
  workflowRunId: string | null;
  postId: string | null;
  error: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
export type GetPostGenerationResponse = {
  job: PostGenerationJob;
  events: PostGenerationEvent[];
};
export type PostGenerationCreatedResponse = {
  organization: Organization;
  job: PostGenerationJob;
};

export type CreatePostGenerationRequest = {
  contentType: string;
  lookbackWindow?: string;
  brandVoiceId?: string;
  brandIdentityId?: string | null;
  repositoryIds?: string[];
  linearIntegrationIds?: string[];
  integrations?: { github?: string[]; linear?: string[] };
  github?: { repositories: Array<{ owner: string; repo: string }> };
  dataPoints?: {
    includePullRequests?: boolean;
    includeCommits?: boolean;
    includeReleases?: boolean;
    includeLinearData?: boolean;
  };
  selectedItems?: Record<string, unknown>;
  timezone?: string;
};
export type UpdatePostBody = {
  title?: string;
  slug?: string | null;
  markdown?: string;
  status?: "draft" | "published";
};
