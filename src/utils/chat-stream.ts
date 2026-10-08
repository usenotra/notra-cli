import { Errors } from '../cli/core';
import { isRecord } from './records';
import type { ChatStreamResponse, ChatToolCall, PendingChatApproval } from '../types/chats';

export function parseChatStream(stream: string): ChatStreamResponse {
  let text = '';
  let chatId: string | null = null;
  const tools = new Map<string, ChatToolCall>();
  const approvals = new Map<string, PendingChatApproval>();
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
    if (frame.type === 'tool-input-available' && typeof frame.toolCallId === 'string' && typeof frame.toolName === 'string') {
      tools.set(frame.toolCallId, { toolName: frame.toolName, input: frame.input });
    }
    if (frame.type === 'tool-approval-request' && frame.isAutomatic !== true &&
      typeof frame.approvalId === 'string' && typeof frame.toolCallId === 'string') {
      approvals.set(frame.approvalId, {
        id: frame.approvalId, toolCallId: frame.toolCallId,
        ...(typeof frame.reason === 'string' ? { reason: frame.reason } : {}),
        ...(frame.approvalDescriptor !== undefined ? { approvalDescriptor: frame.approvalDescriptor } : {}),
      });
    }
    if (frame.type === 'tool-approval-response' && typeof frame.approvalId === 'string' && typeof frame.approved === 'boolean') {
      approvals.delete(frame.approvalId);
    }
  }
  const pendingApprovals = [...approvals.values()].map((approval) => ({ ...approval, ...tools.get(approval.toolCallId) }));
  return {
    chatId, text: text || (pendingApprovals.length ? '' : stream),
    ...(pendingApprovals.length ? { pendingApprovals } : {}),
  };
}
