import * as z from 'zod';

export const oauthClientResponseSchema = z.object({
  client_id: z.string().min(1),
  token_endpoint_auth_method: z.literal('none'),
});

export const authenticationResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive().optional(),
  token_type: z.string().regex(/^bearer$/i).transform(() => 'Bearer' as const).optional(),
  organization_id: z.string().nullish(),
  user: z
    .object({
      email: z.string().nullish(),
    })
    .nullish(),
});

export const refreshResponseSchema = authenticationResponseSchema.extend({
  refresh_token: z.string().min(1).optional(),
});

export const oauthErrorResponseSchema = z.object({
  error: z.string(),
  error_description: z.string().nullish(),
});
