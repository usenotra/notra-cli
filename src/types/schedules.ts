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
export type ScheduleBody = {
  name: string;
  sourceType: "cron";
  sourceConfig: { cron: ScheduleCron };
  targets: { repositoryIds: string[] };
  outputType: string;
  outputConfig?: {
    publishDestination?: string;
    brandVoiceId?: string;
    instructions?: string;
  };
  enabled: boolean;
  autoPublish?: boolean;
  lookbackWindow?: string;
};
export type Schedule = Omit<ScheduleBody, "outputConfig"> & {
  id: string;
  organizationId: string;
  autoPublish: boolean;
  createdAt: string;
  updatedAt: string;
  lookbackWindow: string;
  outputConfig?: ScheduleBody["outputConfig"] | null;
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
  "output-type"?: string;
  "publish-destination"?: string;
  "brand-voice"?: string;
  lookback?: string;
  enabled?: boolean;
  "auto-publish"?: boolean;
};
