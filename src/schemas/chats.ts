import type { ZodObject } from 'zod';
import { operationBodySchema } from './api-command';

function chatBodySchema(schema: ZodObject) {
  return schema.superRefine((body, context) => {
    const approvals = Array.isArray(body.approvals) && body.approvals.length > 0;
    if (!body.message && !approvals) {
      context.addIssue({ code: 'custom', message: 'Provide a message or approvals.' });
    }
    if (body.message && approvals) {
      context.addIssue({ code: 'custom', message: 'Send either a message or approvals, not both.' });
    }
  });
}

export const createChatRequestSchema = chatBodySchema(operationBodySchema('createChat')).refine(
  (body) => !(Array.isArray(body.approvals) && body.approvals.length > 0),
  'Approvals can only be sent to an existing chat.',
);

export const postChatMessageRequestSchema = chatBodySchema(operationBodySchema('postChatMessage'));
