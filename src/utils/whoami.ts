import chalk from 'chalk';
import { WORKSPACE_SELECTION_HINT } from '../constants/workspaces';
import type { WorkspacesResponse } from '../types/workspaces';
import { renderJson, sanitizeTerminalText, shouldUseColor } from './output';

const warn = (text: string) => (shouldUseColor() ? chalk.yellow(text) : text);

/**
 * The workspace context as JSON. While an account API key has selected no
 * workspace, the API only falls back to one for discovery and every other
 * command fails, so a hint names the workspaces to pick from.
 */
export function renderWhoAmI(result: unknown): string {
  const json = renderJson(result);
  const { selectionRequired, workspaces = [] } = result as WorkspacesResponse;
  if (selectionRequired !== true) return json;
  const choices = workspaces
    .filter((workspace) => workspace.status !== 'pending')
    .map((workspace) => `${workspace.name} (${workspace.slug})`)
    .join(', ');
  const hint = `No workspace is selected, so other commands will fail. This key can act in: ${choices}. ${WORKSPACE_SELECTION_HINT}`;
  return `${json}\n${warn(sanitizeTerminalText(hint))}`;
}
