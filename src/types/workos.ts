import type * as z from 'zod';
import {
  authenticationResponseSchema,
  deviceAuthorizationResponseSchema,
} from '../schemas/workos';

export type DeviceAuthorizationResponse = z.infer<
  typeof deviceAuthorizationResponseSchema
>;

export type AuthenticationResponse = z.infer<typeof authenticationResponseSchema>;

export type DevicePollResult =
  | { status: 'success'; authentication: AuthenticationResponse }
  | { status: 'pending' }
  | { status: 'slow_down' };
