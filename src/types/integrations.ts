import type { Organization } from "./common";

export type CreateGitHubIntegrationRequest = {
  owner: string;
  repo: string;
  branch?: string | null;
  token?: string | null;
};
export type Integration = {
  id: string;
  displayName: string;
  owner?: string | null;
  repo?: string | null;
  linearTeamName?: string | null;
  linearOrganizationName?: string | null;
};
export type IntegrationsResponse = {
  github: Integration[];
  linear: Integration[];
  slack: unknown[];
  organization: Organization;
};
export type GitHubIntegrationResponse = {
  github: Integration;
  organization: Organization;
};

export type IntegrationListRow = {
  id: string;
  type: "github" | "slack" | "linear";
  display: string;
  detail: string;
};

export type IntegrationListData = Pick<
  IntegrationsResponse,
  "github" | "linear" | "slack"
>;
