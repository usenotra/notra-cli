import { describe, expect, test } from 'bun:test';
import { schedulePostRequestSchema } from './post-schedule';
import { operationBodySchema } from './api-command';
import { createChatRequestSchema, postChatMessageRequestSchema } from './chats';
import { agentMessageRequestSchema } from './agents';
import { createPostRequestSchema } from './posts';
import { patchSkillRequestSchema } from './skills';
import { createWebhookRequestSchema } from './webhooks';

describe('post publishing timestamps', () => {
  for (const scheduledAt of [
    '2027-01-01T08:00:00Z',
    '2027-01-01T08:00:00+01:00',
    '2027-01-01T08:00:00.123-07:00',
  ]) {
    test(`accepts and preserves ${scheduledAt}`, () => {
      expect(schedulePostRequestSchema.parse({ scheduledAt })).toEqual({
        scheduledAt, timeZone: 'UTC', destinations: [],
      });
    });
  }

  for (const scheduledAt of [
    '2027-01-01T08:00:00',
    '2027-02-30T08:00:00+01:00',
    '2027-01-01T08:00:00+25:00',
    'not-a-date',
  ]) {
    test(`rejects ${scheduledAt}`, () => {
      expect(() => schedulePostRequestSchema.parse({ scheduledAt })).toThrow();
    });
  }
});

test('body schema compilation rejects unknown operations and operations without bodies', () => {
  expect(() => operationBodySchema('unknown')).toThrow('No bundled request body');
  expect(() => operationBodySchema('listSkills')).toThrow('No bundled request body');
});

describe('domain request rules', () => {
  test('only existing chats accept approvals, and they cannot be mixed with messages', () => {
    const approvals = [{ id: 'approval_1', approved: true }];
    expect(createChatRequestSchema.safeParse({ message: 'Hi' }).success).toBe(true);
    expect(createChatRequestSchema.safeParse({ approvals }).success).toBe(false);
    expect(postChatMessageRequestSchema.parse({ approvals })).toEqual({ approvals });
    expect(postChatMessageRequestSchema.safeParse({ message: 'Hi', approvals }).success).toBe(false);
    expect(postChatMessageRequestSchema.safeParse({}).success).toBe(false);
  });

  test('agent continuations require a message or input responses', () => {
    expect(agentMessageRequestSchema.safeParse({ message: 'Continue' }).success).toBe(true);
    expect(agentMessageRequestSchema.safeParse({ inputResponses: [{ requestId: 'request_1', optionId: 'approve' }] }).success).toBe(true);
    expect(agentMessageRequestSchema.safeParse({ inputResponses: [] }).success).toBe(false);
  });

  test('post slugs are restricted to blog posts and changelogs', () => {
    for (const contentType of ['blog_post', 'changelog']) {
      expect(createPostRequestSchema.safeParse({ title: 'Ship notes', contentType, slug: 'ship-notes' }).success).toBe(true);
    }
    expect(createPostRequestSchema.safeParse({ title: 'Ship notes', contentType: 'tweet', slug: 'ship-notes' }).success).toBe(false);
  });

  test('empty skill patches and non-HTTPS webhook endpoints are rejected', () => {
    expect(patchSkillRequestSchema.safeParse({}).success).toBe(false);
    expect(patchSkillRequestSchema.safeParse({ description: 'Updated' }).success).toBe(true);
    expect(createWebhookRequestSchema.safeParse({ url: 'http://example.com/hooks', events: ['post.created'] }).success).toBe(false);
    expect(createWebhookRequestSchema.safeParse({ url: 'https://example.com/hooks', events: ['post.created'] }).success).toBe(true);
  });
});
