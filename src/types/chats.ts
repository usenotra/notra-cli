export type ChatToolCall = { toolName: string; input: unknown };

export type PendingChatApproval = Partial<ChatToolCall> & {
  id: string;
  toolCallId: string;
  reason?: string;
  approvalDescriptor?: unknown;
};

export type ChatStreamResponse = {
  chatId: string | null;
  text: string;
  pendingApprovals?: PendingChatApproval[];
};
