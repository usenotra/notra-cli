import type { Organization } from "./common";

export type ScheduleCron = {
  frequency: string;
  hour: number;
  minute: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  intervalDays?: number;
  anchorDate?: string;
};
export type ScheduleNotify = { slack: boolean; email: boolean };
export type ScheduleTargets = { repositoryIds?: string[]; linearIntegrationIds?: string[] };
export type ScheduleOutputConfig = {
  publishDestination?: string;
  brandVoiceId?: string;
  instructions?: string;
  notify?: ScheduleNotify;
};
export type ScheduleBody = {
  name: string;
  sourceType: "cron";
  sourceConfig: { cron: ScheduleCron };
  targets: ScheduleTargets;
  outputType: string;
  outputConfig?: ScheduleOutputConfig;
  enabled: boolean;
  autoPublish?: boolean;
  lookbackWindow?: string;
};
export type ScheduleUpdateBody = Partial<Omit<ScheduleBody, "outputConfig">> & {
  outputConfig?: { [K in keyof ScheduleOutputConfig]?: ScheduleOutputConfig[K] | null } | null;
};
export type Schedule = Omit<ScheduleBody, "outputConfig" | "targets"> & {
  id: string;
  organizationId: string;
  targets: { repositoryIds: string[]; linearIntegrationIds?: string[] };
  autoPublish: boolean;
  createdAt: string;
  updatedAt: string;
  lookbackWindow: string;
  outputConfig?: ScheduleOutputConfig | null;
};
export type ListSchedulesResponse = {
  schedules: Schedule[];
  repositoryMap: Record<string, string>;
  organization: Organization;
};
export type ScheduleResponse = {
  schedule: Schedule;
  organization: Organization;
};

export type ScheduleCreateFlags = {
  name?: string;
  frequency?: string;
  hour?: number;
  minute?: number;
  "day-of-week"?: number;
  "day-of-month"?: number;
  "interval-days"?: number;
  "anchor-date"?: string;
  repository?: string[];
  "linear-integration"?: string[];
  "output-type"?: string;
  "publish-destination"?: string;
  "brand-voice"?: string;
  lookback?: string;
  enabled?: boolean;
  "auto-publish"?: boolean;
};
