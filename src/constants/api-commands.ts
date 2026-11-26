import type { JSONSchema } from 'zod/v4/core';

// Query parameters an API supports but its published OpenAPI document leaves
// out. Fed through normal parameter generation and validation. Empty while the
// spec covers every parameter the CLI sends.
export const API_QUERY_PARAMETER_SCHEMAS: Readonly<Record<string, Record<string, JSONSchema.JSONSchema>>> = {};

export const API_ACTION_CONFIRMATIONS: Readonly<Record<string, string>> = {
  dismissGeoPromptSuggestion: 'Dismiss this prompt suggestion? It cannot be brought back.',
  createGeoPromptScan: 'Rescan this GEO prompt? It uses AI credits.',
  runSchedule: 'Run this schedule now? Generation uses AI credits, and auto-publish schedules publish the result.',
  startAutopilotRun: 'Run Autopilot now? It uses AI credits and can open pull requests under your current approval settings.',
  stopAutopilotRun: 'Stop this Autopilot run? Changes it already made will remain.',
  writeAutopilotFinding: 'Write this finding now? It uses AI credits and opens a pull request.',
  requestAutopilotChanges: 'Post this instruction on the pull request? It goes out under your name, uses AI credits and changes the branch.',
  mergeAutopilotFinding: "Merge this finding's pull request on GitHub? That publishes it.",
  dismissAutopilotFinding: 'Dismiss this finding? An open pull request is closed, and a reason that states a preference becomes a standing rule.',
  startAutopilotWorkflowRun: 'Run this custom workflow now? It can use AI credits and act on connected services.',
  sendOutreachPitch: 'Send this pitch? It emails a real person from your connected mailbox, now or at --send-at.',
  deleteOutreachPitch: 'Delete this pitch? It will not be sent, and the page will not be pitched again.',
  disconnectOutreachMailbox: 'Disconnect the outreach mailbox? Scheduled pitches go back to drafts.',
  createChat: 'Start this chat? It uses AI credits, and agent tools may modify data or external services.',
  postChatMessage: 'Send this chat message or approval? It uses AI credits, and agent tools may modify data or external services.',
  createAgentSession: 'Start this agent session? It uses AI credits, and agent tools may modify data or external services.',
  sendAgentSessionMessage: 'Continue this agent session? It uses AI credits, and agent tools may modify data or external services.',
};
