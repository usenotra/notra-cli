import { describe, expect, test } from 'bun:test';
import {
  brandIdentityDeleteResponseSchema,
  brandIdentityMutationResponseSchema,
  brandIdentityResponseSchema,
} from './brands';
import {
  listPostsResponseSchema,
  postDeleteResponseSchema,
} from './posts';

const organization = { id: 'org_1', slug: 'notra', name: 'Notra', logo: null };

describe('curated API response schemas', () => {
  test('accepts image posts without Markdown', () => {
    const result = listPostsResponseSchema.parse({
      organization,
      posts: [{
        id: 'post_1',
        title: 'Launch',
        slug: null,
        content: 'https://cdn.example/post.png',
        htmlUrl: 'https://cdn.example/post.html',
        markdown: null,
        rawHtml: null,
        recommendations: null,
        contentType: 'linkedin_carousel',
        sourceMetadata: null,
        status: 'draft',
        createdAt: '2026-09-17T00:00:00.000Z',
        updatedAt: '2026-09-17T00:00:00.000Z',
      }],
      pagination: {
        limit: 10,
        currentPage: 1,
        nextPage: null,
        previousPage: null,
        totalPages: 1,
        totalItems: 1,
      },
    });
    expect(result.posts[0]?.markdown).toBeNull();
  });

  test('matches current deletion envelopes instead of the old deleted boolean', () => {
    expect(postDeleteResponseSchema.safeParse({ id: 'post_1', organization }).success).toBe(true);
    expect(postDeleteResponseSchema.safeParse({ id: 'post_1', deleted: true }).success).toBe(false);
    expect(brandIdentityDeleteResponseSchema.safeParse({
      id: 'brand_1',
      organization,
      disabledSchedules: [{ id: 'schedule_1', name: 'Weekly update' }],
      disabledEvents: [],
    }).success).toBe(true);
  });

  test('accepts a missing brand on reads but not on mutations', () => {
    const missing = { organization, brandIdentity: null };
    expect(brandIdentityResponseSchema.safeParse(missing).success).toBe(true);
    expect(brandIdentityMutationResponseSchema.safeParse(missing).success).toBe(false);
  });
});
