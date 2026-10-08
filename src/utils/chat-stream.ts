import { Errors } from '../cli/core';
import { isRecord } from './records';
import type { ChatStreamResponse } from '../types/chats';

export function parseChatStream(stream: string): ChatStreamResponse {
  let text = '';
  let chatId: string | null = null;
  for (const line of stream.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') continue;
    let frame: unknown;
    try { frame = JSON.parse(payload); } catch { continue; }
    if (!isRecord(frame)) continue;
    if (frame.type === 'error') {
      throw new Errors.CLIError(typeof frame.errorText === 'string' ? frame.errorText : 'Chat generation failed.');
    }
    const fragment = frame.delta ?? frame.textDelta;
    if (frame.type === 'text-delta' && typeof fragment === 'string') text += fragment;
    if (isRecord(frame.messageMetadata) && typeof frame.messageMetadata.chatId === 'string') {
      chatId ??= frame.messageMetadata.chatId;
    }
  }
  return { chatId, text: text || stream };
}
