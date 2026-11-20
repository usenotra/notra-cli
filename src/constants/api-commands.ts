import type { JSONSchema } from 'zod/v4/core';

// Supported by the agent API but missing from its published OpenAPI document.
// Feed it through normal parameter generation and validation, not stream logic.
export const API_QUERY_PARAMETER_SCHEMAS: Readonly<Record<string, Record<string, JSONSchema.JSONSchema>>> = {
  streamAgentSessionEvents: {
    startIndex: { type: 'integer', minimum: 0, description: 'Resume the event stream at this index.' },
  },
};

export const API_ACTION_CONFIRMATIONS: Readonly<Record<string, string>> = {
  dismissGeoPromptSuggestion: 'Dismiss this prompt suggestion? It cannot be brought back.',
  createGeoPromptScan: 'Rescan this GEO prompt? It uses AI credits.',
  runSchedule: 'Run this schedule now? Generation uses AI credits, and auto-publish schedules publish the result.',
  startAutopilotRun: 'Run Autopilot now? It uses AI credits and can open pull requests under your current approval settings.',
  stopAutopilotRun: 'Stop this Autopilot run? Changes it already made will remain.',
  startAutopilotWorkflowRun: 'Run this custom workflow now? It can use AI credits and act on connected services.',
  createChat: 'Start this chat? It uses AI credits, and agent tools may modify data or external services.',
  postChatMessage: 'Send this chat message or approval? It uses AI credits, and agent tools may modify data or external services.',
  createAgentSession: 'Start this agent session? It uses AI credits, and agent tools may modify data or external services.',
  sendAgentSessionMessage: 'Continue this agent session? It uses AI credits, and agent tools may modify data or external services.',
};
