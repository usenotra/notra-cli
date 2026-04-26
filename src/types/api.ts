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
