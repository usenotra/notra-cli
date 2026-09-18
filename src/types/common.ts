export type Organization = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
};

export type Pagination = {
  limit: number;
  currentPage: number;
  nextPage: number | null;
  previousPage: number | null;
  totalPages: number;
  totalItems: number;
};

export type DeletionResponse = { id: string; organization: Organization };
export type DisabledAutomation = { id: string; name: string };
export type CascadingDeletionResponse = DeletionResponse & {
  disabledSchedules: DisabledAutomation[];
  disabledEvents: DisabledAutomation[];
};
