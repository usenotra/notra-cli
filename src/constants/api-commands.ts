import type { JSONSchema } from 'zod/v4/core';

// Supported by the agent API but missing from its published OpenAPI document.
// Feed it through normal parameter generation and validation, not stream logic.
export const API_QUERY_PARAMETER_SCHEMAS: Readonly<Record<string, Record<string, JSONSchema.JSONSchema>>> = {
  streamAgentSessionEvents: {
    startIndex: { type: 'integer', minimum: 0, description: 'Resume the event stream at this index.' },
  },
};

export const API_ACTION_CONFIRMATIONS: Readonly<Record<string, string>> = {
  createChat: 'Start this chat? It uses AI credits, and agent tools may modify data or external services.',
  postChatMessage: 'Send this chat message or approval? It uses AI credits, and agent tools may modify data or external services.',
  createAgentSession: 'Start this agent session? It uses AI credits, and agent tools may modify data or external services.',
  sendAgentSessionMessage: 'Continue this agent session? It uses AI credits, and agent tools may modify data or external services.',
};
