import { describe, expect, test } from 'bun:test';
import { parseChatStream } from './chat-stream';

describe('chat SSE replies', () => {
  test('assembles text deltas and metadata across CRLF frames', () => {
    expect(parseChatStream('data: {"type":"text-delta","delta":"Hallo "}\r\n\r\ndata:{"type":"text-delta","textDelta":"🌍","messageMetadata":{"chatId":"chat_1"}}\r\ndata: [DONE]')).toEqual({ chatId: 'chat_1', text: 'Hallo 🌍' });
  });
  test('ignores malformed frames and optional metadata without discarding text', () => {
    expect(parseChatStream('data: nope\ndata: {"type":"text-delta","delta":"Hello","messageMetadata":false}\ndata: null')).toEqual({ chatId: null, text: 'Hello' });
  });
  test('preserves unfamiliar streams rather than hiding them', () => {
    expect(parseChatStream('data: {"type":"new-protocol"}').text).toBe('data: {"type":"new-protocol"}');
  });
  test('reports application errors inside HTTP 200 streams as failures', () => {
    expect(() => parseChatStream('data: {"type":"error","errorText":"No credits"}')).toThrow('No credits');
  });
});
