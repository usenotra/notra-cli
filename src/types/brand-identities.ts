import type { Organization } from "./common";

export type BrandIdentity = {
  id: string;
  name: string;
  isDefault: boolean;
  websiteUrl: string;
  companyName: string | null;
  companyDescription: string | null;
  toneProfile: string | null;
  customTone: string | null;
  customInstructions: string | null;
  audience: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateBrandIdentityRequest = { name?: string; websiteUrl: string };
export type UpdateBrandIdentityBody = {
  name?: string;
  websiteUrl?: string;
  companyName?: string | null;
  companyDescription?: string | null;
  toneProfile?: string | null;
  customTone?: string | null;
  customInstructions?: string | null;
  audience?: string | null;
  language?: string | null;
  isDefault?: true;
};
export type BrandIdentityGenerationJob = {
  id: string;
  organizationId: string;
  brandIdentityId: string;
  status: "queued" | "running" | "completed" | "failed" | (string & {});
  step: string | null;
  currentStep: number;
  totalSteps: number;
  workflowRunId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
export type GetBrandIdentityGenerationResponse = {
  organization: Organization;
  job: BrandIdentityGenerationJob;
};
export type BrandIdentityListResponse = {
  organization: Organization;
  brandIdentities: BrandIdentity[];
};
export type BrandIdentityResponse = {
  organization: Organization;
  brandIdentity: BrandIdentity | null;
};
export type BrandIdentityMutationResponse = {
  organization: Organization;
  brandIdentity: BrandIdentity;
};
export type BrandIdentityGenerationCreatedResponse = {
  organization: Organization;
  job: BrandIdentityGenerationJob;
};
