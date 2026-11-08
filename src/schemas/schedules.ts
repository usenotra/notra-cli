import type {
  ListSchedulesResponse,
  Schedule,
  ScheduleBody,
  ScheduleResponse,
  ScheduleUpdateBody,
} from "../types/schedules";
import * as z from "zod";
import { CONTENT_TYPES, LOOKBACK_WINDOWS } from "../constants/posts";
import {
  PUBLISH_DESTINATIONS,
  SCHEDULE_FREQUENCIES,
} from "../constants/schedules";
import { parseApiRequest } from "../utils/parse-api-request";
import { deletionResponseSchema, organizationSchema } from "./common";

const scheduleResponseCronSchema = z
  .object({
    frequency: z.string(),
    hour: z.number(),
    minute: z.number(),
    dayOfWeek: z.number().optional(),
    dayOfMonth: z.number().optional(),
    intervalDays: z.number().optional(),
    anchorDate: z.string().optional(),
  })
  .passthrough();
const scheduleSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string(),
    sourceType: z.literal("cron"),
    sourceConfig: z.object({ cron: scheduleResponseCronSchema }).passthrough(),
    targets: z
      .object({
        repositoryIds: z.array(z.string()),
        linearIntegrationIds: z.array(z.string()).optional(),
      })
      .passthrough(),
    outputType: z.string(),
    outputConfig: z
      .object({
        publishDestination: z.string().optional(),
        brandVoiceId: z.string().optional(),
        instructions: z.string().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    enabled: z.boolean(),
    autoPublish: z.boolean(),
    lookbackWindow: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough() satisfies z.ZodType<Schedule>;

export const schedulesResponseSchema = z
  .object({
    schedules: z.array(scheduleSchema),
    repositoryMap: z.record(z.string(), z.string()),
    organization: organizationSchema,
  })
  .passthrough() satisfies z.ZodType<ListSchedulesResponse>;
export const scheduleResponseSchema = z
  .object({
    schedule: scheduleSchema,
    organization: organizationSchema,
  })
  .passthrough() satisfies z.ZodType<ScheduleResponse>;
export const scheduleDeleteResponseSchema = deletionResponseSchema;

const scheduleCronSchema = z
  .object({
    frequency: z.enum(SCHEDULE_FREQUENCIES),
    hour: z.int().min(0).max(23),
    minute: z.int().min(0).max(59),
    dayOfWeek: z.int().min(0).max(6).optional(),
    dayOfMonth: z.int().min(1).max(31).optional(),
    intervalDays: z.int().min(2).max(90).optional(),
    anchorDate: z.iso.date().optional(),
  })
  .strict()
  .superRefine((cron, ctx) => {
    if (cron.frequency === "weekly" && cron.dayOfWeek === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfWeek"],
        message: "dayOfWeek is required for weekly schedules.",
      });
    }
    if (cron.frequency === "monthly" && cron.dayOfMonth === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfMonth"],
        message: "dayOfMonth is required for monthly schedules.",
      });
    }
    if (cron.frequency === "custom" && cron.intervalDays === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["intervalDays"],
        message: "intervalDays is required for custom schedules.",
      });
    }
    if (cron.frequency !== "weekly" && cron.dayOfWeek !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfWeek"],
        message: "dayOfWeek is only allowed for weekly schedules.",
      });
    }
    if (cron.frequency !== "monthly" && cron.dayOfMonth !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["dayOfMonth"],
        message: "dayOfMonth is only allowed for monthly schedules.",
      });
    }
    if (cron.frequency !== "custom" && cron.intervalDays !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["intervalDays"],
        message: "intervalDays is only allowed for custom schedules.",
      });
    }
    if (cron.frequency !== "custom" && cron.anchorDate !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["anchorDate"],
        message: "anchorDate is only allowed for custom schedules.",
      });
    }
  });

const integrationIdsSchema = z.array(z.string().trim().min(1));
const outputConfigFields = {
  publishDestination: z.enum(PUBLISH_DESTINATIONS),
  brandVoiceId: z.string().trim().min(1),
  instructions: z.string().trim().min(1).max(2000),
  notify: z.object({ slack: z.boolean(), email: z.boolean() }).strict(),
};

const createScheduleBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    sourceType: z.literal("cron"),
    sourceConfig: z.object({ cron: scheduleCronSchema }).strict(),
    targets: z
      .object({
        repositoryIds: integrationIdsSchema.optional(),
        linearIntegrationIds: integrationIdsSchema.optional(),
      })
      .strict()
      .refine(
        (targets) =>
          (targets.repositoryIds?.length ?? 0) > 0 ||
          (targets.linearIntegrationIds?.length ?? 0) > 0,
        {
          message: "Select at least one GitHub or Linear integration.",
          path: ["repositoryIds"],
        },
      ),
    outputType: z.enum(CONTENT_TYPES),
    outputConfig: z
      .object({
        publishDestination: outputConfigFields.publishDestination.optional(),
        brandVoiceId: outputConfigFields.brandVoiceId.optional(),
        instructions: outputConfigFields.instructions.optional(),
        notify: outputConfigFields.notify.optional(),
      })
      .strict()
      .optional(),
    enabled: z.boolean(),
    autoPublish: z.boolean().optional(),
    lookbackWindow: z.enum(LOOKBACK_WINDOWS).optional(),
  })
  .strict();

// PATCH merges: omitted fields keep their value, and null clears an output setting.
const updateScheduleBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    sourceType: z.literal("cron").optional(),
    sourceConfig: z.object({ cron: scheduleCronSchema }).strict().optional(),
    targets: z
      .object({
        repositoryIds: integrationIdsSchema.optional(),
        linearIntegrationIds: integrationIdsSchema.optional(),
      })
      .strict()
      .refine(
        (targets) =>
          targets.repositoryIds?.length !== 0 ||
          targets.linearIntegrationIds?.length !== 0,
        {
          message: "A schedule needs at least one GitHub or Linear integration.",
          path: ["repositoryIds"],
        },
      )
      .optional(),
    outputType: z.enum(CONTENT_TYPES).optional(),
    outputConfig: z
      .object({
        publishDestination: outputConfigFields.publishDestination.nullable().optional(),
        brandVoiceId: outputConfigFields.brandVoiceId.nullable().optional(),
        instructions: outputConfigFields.instructions.nullable().optional(),
        notify: outputConfigFields.notify.nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
    enabled: z.boolean().optional(),
    autoPublish: z.boolean().optional(),
    lookbackWindow: z.enum(LOOKBACK_WINDOWS).optional(),
  })
  .strict()
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  });

export function validateCreateScheduleRequest(input: unknown): ScheduleBody {
  return parseApiRequest(
    createScheduleBodySchema,
    input,
    "Invalid schedule create request",
  );
}

export function validateUpdateScheduleBody(input: unknown): ScheduleUpdateBody {
  return parseApiRequest(
    updateScheduleBodySchema,
    input,
    "Invalid schedule update request",
  );
}
