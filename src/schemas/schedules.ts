import type {
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from '@usenotra/sdk/models/operations';
import * as z from 'zod';
import { CONTENT_TYPES, LOOKBACK_WINDOWS } from '../constants/posts';
import { PUBLISH_DESTINATIONS, SCHEDULE_FREQUENCIES } from '../constants/schedules';
import { parseApiRequest } from '../utils/parse-api-request';

const scheduleCronSchema = z
  .object({
    frequency: z.enum(SCHEDULE_FREQUENCIES),
    hour: z.int().min(0).max(23),
    minute: z.int().min(0).max(59),
    dayOfWeek: z.int().min(0).max(6).optional(),
    dayOfMonth: z.int().min(1).max(31).optional(),
  })
  .strict()
  .superRefine((cron, ctx) => {
    if (cron.frequency === 'weekly' && cron.dayOfWeek === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfWeek'],
        message: 'dayOfWeek is required for weekly schedules.',
      });
    }
    if (cron.frequency === 'monthly' && cron.dayOfMonth === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfMonth'],
        message: 'dayOfMonth is required for monthly schedules.',
      });
    }
    if (cron.frequency !== 'weekly' && cron.dayOfWeek !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfWeek'],
        message: 'dayOfWeek is only allowed for weekly schedules.',
      });
    }
    if (cron.frequency !== 'monthly' && cron.dayOfMonth !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfMonth'],
        message: 'dayOfMonth is only allowed for monthly schedules.',
      });
    }
  });

const scheduleBodySchema = z
  .object({
    name: z.string().min(1),
    sourceType: z.literal('cron'),
    sourceConfig: z.object({ cron: scheduleCronSchema }).strict(),
    targets: z.object({ repositoryIds: z.array(z.string().min(1)).min(1) }).strict(),
    outputType: z.enum(CONTENT_TYPES),
    outputConfig: z
      .object({
        publishDestination: z.enum(PUBLISH_DESTINATIONS).optional(),
        brandVoiceId: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    enabled: z.boolean(),
    autoPublish: z.boolean().optional(),
    lookbackWindow: z.enum(LOOKBACK_WINDOWS).optional(),
  })
  .strict();

export function validateCreateScheduleRequest(input: unknown): CreateScheduleRequest {
  return parseApiRequest(scheduleBodySchema, input, 'Invalid schedule create request');
}

export function validateUpdateScheduleBody(input: unknown): UpdateScheduleRequest['body'] {
  return parseApiRequest(scheduleBodySchema, input, 'Invalid schedule update request');
}
