import type {
  CreateBrandIdentityRequest,
  UpdateBrandIdentityRequest,
} from '@usenotra/sdk/models/operations';
import * as z from 'zod';
import { LANGUAGES, TONE_PROFILES } from '../constants/brands';
import { parseApiRequest } from '../utils/parse-api-request';

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
    'At least one brand identity field is required.',
  );

export function validateCreateBrandIdentityRequest(
  input: unknown,
): CreateBrandIdentityRequest {
  return parseApiRequest(
    createBrandIdentitySchema,
    input,
    'Invalid brand identity generation request',
  );
}

export function validateUpdateBrandIdentityBody(
  input: unknown,
): UpdateBrandIdentityRequest['body'] {
  return parseApiRequest(
    updateBrandIdentityBodySchema,
    input,
    'Invalid brand identity update request',
  );
}
