import type * as z from 'zod';
import { authenticationResponseSchema } from '../schemas/workos';

export type AuthenticationResponse = z.infer<typeof authenticationResponseSchema>;
