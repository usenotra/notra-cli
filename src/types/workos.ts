import * as z from 'zod';

export const deviceAuthorizationResponseSchema = z.object({
  device_code: z.string(),
  user_code: z.string(),
  verification_uri: z.string(),
  verification_uri_complete: z.string(),
  expires_in: z.number(),
  interval: z.number(),
});

export type DeviceAuthorizationResponse = z.infer<
  typeof deviceAuthorizationResponseSchema
>;

export const authenticationResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  organization_id: z.string().nullish(),
  user: z
    .object({
      email: z.string().nullish(),
    })
    .nullish(),
});

export type AuthenticationResponse = z.infer<typeof authenticationResponseSchema>;

export const oauthErrorResponseSchema = z.object({
  error: z.string(),
  error_description: z.string().nullish(),
});

export type OauthErrorResponse = z.infer<typeof oauthErrorResponseSchema>;
