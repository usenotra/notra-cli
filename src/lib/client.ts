import { NOTRA_API_KEY_ENV_VAR } from '../constants/config';
import { VERSION } from '../constants/version';
import {
  brandIdentityDeleteResponseSchema,
  brandIdentityGenerationCreatedResponseSchema,
  brandIdentityGenerationResponseSchema,
  brandIdentityListResponseSchema,
  brandIdentityMutationResponseSchema,
  brandIdentityResponseSchema,
} from '../schemas/brands';
import {
  githubIntegrationResponseSchema,
  integrationDeleteResponseSchema,
  integrationsResponseSchema,
} from '../schemas/integrations';
import {
  listPostsResponseSchema,
  postDeleteResponseSchema,
  postGenerationCreatedResponseSchema,
  postGenerationResponseSchema,
  postMutationResponseSchema,
  postResponseSchema,
} from '../schemas/posts';
import {
  scheduleDeleteResponseSchema,
  scheduleResponseSchema,
  schedulesResponseSchema,
} from '../schemas/schedules';
import type {
  BrandIdentityGenerationCreatedResponse,
  BrandIdentityListResponse,
  BrandIdentityMutationResponse,
  BrandIdentityResponse,
  CreateBrandIdentityRequest,
  GetBrandIdentityGenerationResponse,
  UpdateBrandIdentityBody,
} from '../types/brand-identities';
import type { CascadingDeletionResponse, DeletionResponse } from '../types/common';
import type {
  CreateGitHubIntegrationRequest,
  GitHubIntegrationResponse,
  IntegrationsResponse,
} from '../types/integrations';
import type {
  CreatePostGenerationRequest,
  GetPostGenerationResponse,
  ListPostsRequest,
  ListPostsResponse,
  PostGenerationCreatedResponse,
  PostMutationResponse,
  PostResponse,
  UpdatePostBody,
} from '../types/posts';
import type {
  ListSchedulesResponse,
  ScheduleBody,
  ScheduleResponse,
} from '../types/schedules';
import type { ClientOverrides } from '../types/client';
import { getApiKey, getBaseUrl, getStoredAuth } from './config';
import { HttpClient } from './http-client';
import { apiResponseDecoder } from '../utils/parse-api-response';

export class MissingApiKeyError extends Error {
  constructor() {
    super('Not signed in. Run `notra auth login`, set `NOTRA_API_KEY`, or pass `--api-key`.');
    this.name = 'MissingApiKeyError';
  }
}

export function resolveBearerToken(overrides: ClientOverrides = {}): string | undefined {
  return (
    overrides.apiKey ??
    process.env[NOTRA_API_KEY_ENV_VAR] ??
    getStoredAuth()?.accessToken ??
    getApiKey()
  );
}

export function buildClient(overrides: ClientOverrides = {}): NotraClient {
  const bearer = resolveBearerToken(overrides);
  if (!bearer) throw new MissingApiKeyError();
  return new NotraClient({ apiKey: bearer, baseUrl: overrides.baseUrl ?? getBaseUrl() });
}

export class NotraClient extends HttpClient {
  readonly content = new ContentClient(this);
  readonly schedules = new SchedulesClient(this);

  constructor(options: { apiKey?: string; baseUrl: string }) {
    super({ ...options, userAgent: `notra-cli/${VERSION}` });
  }
}

class ContentClient {
  constructor(private readonly http: HttpClient) {}

  listPosts(request: ListPostsRequest = {}): Promise<ListPostsResponse> {
    return this.http.request('GET', '/v1/posts', {
      query: request,
      decode: apiResponseDecoder(listPostsResponseSchema, 'post list'),
    });
  }

  getPost(request: { postId: string }): Promise<PostResponse> {
    return this.http.request('GET', `/v1/posts/${segment(request.postId)}`, {
      decode: apiResponseDecoder(postResponseSchema, 'post'),
    });
  }

  deletePost(request: { postId: string }): Promise<DeletionResponse> {
    return this.http.request('DELETE', `/v1/posts/${segment(request.postId)}`, {
      decode: apiResponseDecoder(postDeleteResponseSchema, 'post deletion response'),
    });
  }

  async updatePost(request: { postId: string; body: UpdatePostBody }): Promise<{
    headers: Record<string, string>;
    result: PostMutationResponse;
  }> {
    const result = await this.http.request(
      'PATCH',
      `/v1/posts/${segment(request.postId)}`,
      {
        body: request.body,
        decode: apiResponseDecoder(postMutationResponseSchema, 'updated post'),
      },
    );
    return { headers: {}, result };
  }

  async createPostGeneration(request: CreatePostGenerationRequest): Promise<{
    headers: Record<string, string>;
    result: PostGenerationCreatedResponse;
  }> {
    const result = await this.http.request('POST', '/v1/posts/generate', {
      body: request,
      decode: apiResponseDecoder(postGenerationCreatedResponseSchema, 'post generation job'),
    });
    return { headers: {}, result };
  }

  getPostGeneration(request: { jobId: string }): Promise<GetPostGenerationResponse> {
    return this.http.request('GET', `/v1/posts/generate/${segment(request.jobId)}`, {
      decode: apiResponseDecoder(postGenerationResponseSchema, 'post generation status'),
    });
  }

  listBrandIdentities(): Promise<BrandIdentityListResponse> {
    return this.http.request('GET', '/v1/brand-identities', {
      decode: apiResponseDecoder(brandIdentityListResponseSchema, 'brand identity list'),
    });
  }

  async createBrandIdentity(request: CreateBrandIdentityRequest): Promise<{
    headers: Record<string, string>;
    result: BrandIdentityGenerationCreatedResponse;
  }> {
    const result = await this.http.request('POST', '/v1/brand-identities/generate', {
      body: request,
      decode: apiResponseDecoder(
        brandIdentityGenerationCreatedResponseSchema,
        'brand identity generation job',
      ),
    });
    return { headers: {}, result };
  }

  getBrandIdentityGeneration(request: {
    jobId: string;
  }): Promise<GetBrandIdentityGenerationResponse> {
    return this.http.request('GET', `/v1/brand-identities/generate/${segment(request.jobId)}`, {
      decode: apiResponseDecoder(
        brandIdentityGenerationResponseSchema,
        'brand identity generation status',
      ),
    });
  }

  getBrandIdentity(request: {
    brandIdentityId: string;
  }): Promise<BrandIdentityResponse> {
    return this.http.request('GET', `/v1/brand-identities/${segment(request.brandIdentityId)}`, {
      decode: apiResponseDecoder(brandIdentityResponseSchema, 'brand identity'),
    });
  }

  deleteBrandIdentity(request: { brandIdentityId: string }): Promise<CascadingDeletionResponse> {
    return this.http.request('DELETE', `/v1/brand-identities/${segment(request.brandIdentityId)}`, {
      decode: apiResponseDecoder(brandIdentityDeleteResponseSchema, 'brand identity deletion response'),
    });
  }

  updateBrandIdentity(request: {
    brandIdentityId: string;
    body: UpdateBrandIdentityBody;
  }): Promise<BrandIdentityMutationResponse> {
    return this.http.request('PATCH', `/v1/brand-identities/${segment(request.brandIdentityId)}`, {
      body: request.body,
      decode: apiResponseDecoder(brandIdentityMutationResponseSchema, 'updated brand identity'),
    });
  }

  listIntegrations(): Promise<IntegrationsResponse> {
    return this.http.request('GET', '/v1/integrations', {
      decode: apiResponseDecoder(integrationsResponseSchema, 'integration list'),
    });
  }

  async createGitHubIntegration(request: CreateGitHubIntegrationRequest): Promise<{
    headers: Record<string, string>;
    result: GitHubIntegrationResponse;
  }> {
    const result = await this.http.request('POST', '/v1/integrations/github', {
      body: request,
      decode: apiResponseDecoder(githubIntegrationResponseSchema, 'GitHub integration'),
    });
    return { headers: {}, result };
  }

  deleteIntegration(request: { integrationId: string }): Promise<CascadingDeletionResponse> {
    return this.http.request('DELETE', `/v1/integrations/${segment(request.integrationId)}`, {
      decode: apiResponseDecoder(integrationDeleteResponseSchema, 'integration deletion response'),
    });
  }
}

class SchedulesClient {
  constructor(private readonly http: HttpClient) {}

  listSchedules(request?: { repositoryIds?: string }): Promise<ListSchedulesResponse> {
    return this.http.request('GET', '/v1/schedules', {
      query: request,
      decode: apiResponseDecoder(schedulesResponseSchema, 'schedule list'),
    });
  }

  createSchedule(body: ScheduleBody): Promise<ScheduleResponse> {
    return this.http.request('POST', '/v1/schedules', {
      body,
      decode: apiResponseDecoder(scheduleResponseSchema, 'schedule'),
    });
  }

  deleteSchedule(request: { scheduleId: string }): Promise<DeletionResponse> {
    return this.http.request('DELETE', `/v1/schedules/${segment(request.scheduleId)}`, {
      decode: apiResponseDecoder(scheduleDeleteResponseSchema, 'schedule deletion response'),
    });
  }

  updateSchedule(request: {
    scheduleId: string;
    body: ScheduleBody;
  }): Promise<ScheduleResponse> {
    return this.http.request('PATCH', `/v1/schedules/${segment(request.scheduleId)}`, {
      body: request.body,
      decode: apiResponseDecoder(scheduleResponseSchema, 'updated schedule'),
    });
  }
}

function segment(value: string): string {
  return encodeURIComponent(value);
}
