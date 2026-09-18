import { afterAll, describe, expect, test } from 'bun:test';
import * as z from 'zod';
import { ApiError, HttpClient } from './http-client';

const server = Bun.serve({
  port: 0,
  fetch: async (request) => {
    const url = new URL(request.url);
    if (url.pathname === '/error') {
      return Response.json({ error: { message: 'Nope', code: 'NOPE' } }, { status: 422 });
    }
    return Response.json({
      method: request.method,
      authorization: request.headers.get('authorization'),
      query: Object.fromEntries(url.searchParams),
      body: request.method === 'POST' ? await request.json() : null,
    });
  },
});

afterAll(() => server.stop(true));

describe('HttpClient', () => {
  const client = new HttpClient({
    baseUrl: `http://127.0.0.1:${server.port}`,
    apiKey: 'secret',
  });

  test('sends auth, query parameters, and JSON bodies', async () => {
    const response = await client.request('POST', '/items', {
      query: { limit: 3, repositoryIds: ['repo_1', 'repo_2'] },
      body: { name: 'test' },
      decode: z.object({
        method: z.string(),
        authorization: z.string(),
        query: z.record(z.string(), z.string()),
        body: z.unknown(),
      }).parse,
    });

    expect(response).toEqual({
      method: 'POST',
      authorization: 'Bearer secret',
      query: { limit: '3', repositoryIds: 'repo_1,repo_2' },
      body: { name: 'test' },
    });
  });

  test('turns structured API errors into ApiError', async () => {
    try {
      await client.request('GET', '/error');
      throw new Error('Expected request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ message: 'Nope', statusCode: 422, code: 'NOPE' });
    }
  });

  test('decodes successful responses instead of trusting a generic cast', async () => {
    await expect(client.request('GET', '/items', {
      decode: z.object({ impossible: z.string() }).parse,
    })).rejects.toThrow();
  });

  test('never sends credentials to an absolute request URL', async () => {
    await expect(client.request('GET', 'https://example.com/steal')).rejects.toThrow(
      'configured Notra API origin',
    );
  });
});
