export type OAuthTestRequest = {
  path: string;
  form: Record<string, string>;
  body?: unknown;
  authorization: string | null;
};

export type OAuthTestClientMetadata = {
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  grant_types: string[];
};
