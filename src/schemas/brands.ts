import type {
  BrandIdentity,
  BrandIdentityGenerationCreatedResponse,
  BrandIdentityListResponse,
  BrandIdentityMutationResponse,
  BrandIdentityResponse,
  CreateBrandIdentityRequest,
  GetBrandIdentityGenerationResponse,
  UpdateBrandIdentityBody,
} from "../types/brand-identities";
import * as z from "zod";
import { LANGUAGES, TONE_PROFILES } from "../constants/brands";
import { parseApiRequest } from "../utils/parse-api-request";
import { cascadingDeletionResponseSchema, organizationSchema } from "./common";

const brandIdentitySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    isDefault: z.boolean(),
    websiteUrl: z.string(),
    companyName: z.string().nullable(),
    companyDescription: z.string().nullable(),
    toneProfile: z.string().nullable(),
    customTone: z.string().nullable(),
    customInstructions: z.string().nullable(),
    audience: z.string().nullable(),
    language: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<BrandIdentity>;

const brandIdentityGenerationJobSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    brandIdentityId: z.string(),
    status: z.string(),
    step: z.string().nullable(),
    currentStep: z.number(),
    totalSteps: z.number(),
    workflowRunId: z.string().nullable(),
    error: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().nullable(),
  })
  .passthrough();

export const brandIdentityListResponseSchema = z
  .object({
    organization: organizationSchema,
    brandIdentities: z.array(brandIdentitySchema),
  })
  .passthrough() satisfies z.ZodType<BrandIdentityListResponse>;
export const brandIdentityResponseSchema = z
  .object({
    organization: organizationSchema,
    brandIdentity: brandIdentitySchema.nullable(),
  })
  .passthrough() satisfies z.ZodType<BrandIdentityResponse>;
export const brandIdentityMutationResponseSchema = z
  .object({
    organization: organizationSchema,
    brandIdentity: brandIdentitySchema,
  })
  .passthrough() satisfies z.ZodType<BrandIdentityMutationResponse>;
export const brandIdentityDeleteResponseSchema =
  cascadingDeletionResponseSchema;
export const brandIdentityGenerationCreatedResponseSchema = z
  .object({
    organization: organizationSchema,
    job: brandIdentityGenerationJobSchema,
  })
  .passthrough() satisfies z.ZodType<BrandIdentityGenerationCreatedResponse>;
export const brandIdentityGenerationResponseSchema = z
  .object({
    organization: organizationSchema,
    job: brandIdentityGenerationJobSchema,
  })
  .passthrough() satisfies z.ZodType<GetBrandIdentityGenerationResponse>;

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
    toneProfile: z.enum(TONE_PROFILES).nullable().optional(),
    customTone: z.string().nullable().optional(),
    customInstructions: z.string().nullable().optional(),
    audience: z.string().nullable().optional(),
    language: z.enum(LANGUAGES).nullable().optional(),
    isDefault: z.literal(true).optional(),
  })
  .strict()
  .refine(
    (body) => Object.keys(body).length > 0,
    "At least one brand identity field is required.",
  );

export function validateCreateBrandIdentityRequest(
  input: unknown,
): CreateBrandIdentityRequest {
  return parseApiRequest(
    createBrandIdentitySchema,
    input,
    "Invalid brand identity generation request",
  );
}

export function validateUpdateBrandIdentityBody(
  input: unknown,
): UpdateBrandIdentityBody {
  return parseApiRequest(
    updateBrandIdentityBodySchema,
    input,
    "Invalid brand identity update request",
  );
}
