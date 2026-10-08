import { afterAll, describe, expect, test } from 'bun:test';
import * as z from 'zod';
import { ApiConnectionError, ApiError, HttpClient } from './http-client';
import { startInterruptedStreamServer } from '../utils/http-test';
import { MAX_NDJSON_EVENT_BYTES } from '../constants/http';

const server = Bun.serve({
  port: 0,
  fetch: async (request) => {
    const url = new URL(request.url);
    if (url.pathname === '/error') {
      return Response.json({ error: { message: 'Nope', code: 'NOPE' } }, { status: 422 });
    }
    if (url.pathname === '/stream') {
      const bytes = new TextEncoder().encode('{"text":"Hallo 🌍"}\n\n{"done":true}');
      return new Response(new ReadableStream({ start(controller) {
        for (let offset = 0; offset < bytes.length; offset += 3) controller.enqueue(bytes.slice(offset, offset + 3));
        controller.close();
      } }));
    }
    if (url.pathname === '/invalid-events') {
      return new Response('{"type":"pending"}\n' + (url.searchParams.has('final') ? '{"broken":' : 'not-json\n'));
    }
    if (url.pathname === '/max-event') {
      return new Response(JSON.stringify({ text: 'a'.repeat(MAX_NDJSON_EVENT_BYTES - 11) }) + '\n');
    }
    if (url.pathname === '/oversized-event') {
      const bytes = new TextEncoder().encode(JSON.stringify({ text: '🌍'.repeat(MAX_NDJSON_EVENT_BYTES / 4) }));
      return new Response(new ReadableStream({ start(controller) {
        for (let offset = 0; offset < bytes.length; offset += 1024) controller.enqueue(bytes.slice(offset, offset + 1024));
        // Deliberately never close: the size guard must fail before EOF/timeout.
      } }));
    }
    if (url.pathname === '/slow-body') {
      return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); } }));
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

  test('does not classify response decoding or request serialization as network errors', async () => {
    const failure = new Error('Invalid response contract');
    await expect(client.request('GET', '/items', { decode: () => { throw failure; } })).rejects.toBe(failure);
    const body: Record<string, unknown> = {};
    body.self = body;
    await expect(client.request('POST', '/items', { body })).rejects.toBeInstanceOf(TypeError);
  });

  test('never sends credentials to an absolute request URL', async () => {
    await expect(client.request('GET', 'https://example.com/steal')).rejects.toThrow(
      'configured Notra API origin',
    );
  });

  test('reads chunked NDJSON, Unicode, blank lines and a final unterminated line', async () => {
    const events = [];
    for await (const event of client.stream('GET', '/stream')) events.push(event);
    expect(events).toEqual([{ text: 'Hallo 🌍' }, { done: true }]);
  });

  test('rejects malformed complete lines and truncated final events after valid output', async () => {
    for (const path of ['/invalid-events', '/invalid-events?final=1']) {
      const stream = client.stream('GET', path);
      expect(await stream.next()).toEqual({ value: { type: 'pending' }, done: false });
      await expect(stream.next()).rejects.toMatchObject({ name: 'ApiResponseDecodeError' });
    }
  });

  test('accepts the event-size boundary and rejects oversized UTF-8 before EOF', async () => {
    const stream = client.stream('GET', '/max-event');
    const event = await stream.next();
    expect(z.object({ text: z.string() }).parse(event.value).text).toHaveLength(MAX_NDJSON_EVENT_BYTES - 11);
    expect((await stream.next()).done).toBe(true);
    await expect(client.stream('GET', '/oversized-event', { timeoutMs: 1000 }).next()).rejects.toMatchObject({
      name: 'ApiResponseDecodeError', issues: [`Event exceeds the ${MAX_NDJSON_EVENT_BYTES} byte limit.`],
    });
  });

  test('stream errors retain their API status', async () => {
    await expect(client.stream('GET', '/error').next()).rejects.toMatchObject({ statusCode: 422 });
  });

  test('classifies interrupted API error bodies as network failures', async () => {
    const interrupted = await startInterruptedStreamServer(503);
    const broken = new HttpClient({ baseUrl: interrupted.baseUrl });
    try {
      await expect(broken.request('GET', '/items')).rejects.toBeInstanceOf(ApiConnectionError);
      await expect(broken.stream('GET', '/events').next()).rejects.toBeInstanceOf(ApiConnectionError);
    } finally {
      interrupted.server.close();
    }
  });

  test('timeouts cover the response body, not just initial headers', async () => {
    await expect(client.request('GET', '/slow-body', { timeoutMs: 20 })).rejects.toMatchObject({ name: 'TimeoutError' });
    await expect(client.stream('GET', '/slow-body', { timeoutMs: 20 }).next()).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  test('honors caller cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(client.request('GET', '/items', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('preserves cancellation errors while reading a live stream', async () => {
    const controller = new AbortController();
    const pending = client.stream('GET', '/slow-body', { signal: controller.signal }).next();
    const timer = setTimeout(() => controller.abort(), 20);
    try {
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      clearTimeout(timer);
    }
  });
});
