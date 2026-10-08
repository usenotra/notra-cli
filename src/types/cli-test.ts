export type ApiCommandFixture = {
  command: string;
  args?: string[];
  method?: string;
  path: string;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
  chat?: boolean;
  stream?: boolean;
};
