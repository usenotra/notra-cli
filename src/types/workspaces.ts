import type { Organization } from './common';

export type Workspace = Organization & {
  role?: string;
  status?: string;
  isCurrent?: boolean;
};

export type WorkspacesResponse = {
  workspaces: Workspace[];
};
