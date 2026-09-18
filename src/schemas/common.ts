import * as z from "zod";
import type {
  CascadingDeletionResponse,
  DeletionResponse,
  Organization,
} from "../types/common";

export const organizationSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    logo: z.string().nullable(),
  })
  .passthrough() satisfies z.ZodType<Organization>;

export const deletionResponseSchema = z
  .object({
    id: z.string(),
    organization: organizationSchema,
  })
  .passthrough() satisfies z.ZodType<DeletionResponse>;

const disabledAutomationSchema = z
  .object({ id: z.string(), name: z.string() })
  .passthrough();

export const cascadingDeletionResponseSchema = deletionResponseSchema.extend({
  disabledSchedules: z.array(disabledAutomationSchema),
  disabledEvents: z.array(disabledAutomationSchema),
}) satisfies z.ZodType<CascadingDeletionResponse>;
