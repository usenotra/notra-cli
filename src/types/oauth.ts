export type OAuthCallback = {
  redirectUri: string;
  code: Promise<string>;
  close: () => void;
};

export type OAuthAuthorizationParameters = {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
};
