import * as z from 'zod';
import type { Workspace, WorkspacesResponse } from '../types/workspaces';
import { organizationSchema } from './common';

const workspaceSchema = organizationSchema.extend({
  role: z.string().optional(),
  status: z.string().optional(),
  isCurrent: z.boolean().optional(),
}).passthrough() satisfies z.ZodType<Workspace>;

export const workspacesResponseSchema = z
  .object({ workspaces: z.array(workspaceSchema) })
  .passthrough() satisfies z.ZodType<WorkspacesResponse>;
