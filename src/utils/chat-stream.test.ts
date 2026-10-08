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
  test('returns outstanding manual approvals with tool context, even without reply text', () => {
    const frames = [
      { type: 'start', messageMetadata: { chatId: 'chat_1' } },
      { type: 'tool-input-available', toolCallId: 'call_1', toolName: 'publishPost', input: { postId: 'post_1' } },
      { type: 'tool-approval-request', approvalId: 'approval_1', toolCallId: 'call_1', reason: 'Confirm publishing', approvalDescriptor: { scope: 'posts:publish' } },
      { type: 'tool-approval-request', approvalId: 'answered', toolCallId: 'call_2' },
      { type: 'tool-approval-response', approvalId: 'answered', approved: false },
      { type: 'tool-approval-request', approvalId: 'automatic', toolCallId: 'call_3', isAutomatic: true },
      { type: 'tool-approval-request', approvalId: 'approval_4', toolCallId: 'call_4' },
    ];
    expect(parseChatStream(frames.map((frame) => `data: ${JSON.stringify(frame)}`).join('\n'))).toEqual({
      chatId: 'chat_1', text: '', pendingApprovals: [
        { id: 'approval_1', toolCallId: 'call_1', toolName: 'publishPost', input: { postId: 'post_1' }, reason: 'Confirm publishing', approvalDescriptor: { scope: 'posts:publish' } },
        { id: 'approval_4', toolCallId: 'call_4' },
      ],
    });
  });
});
