export const CONSENT_LEGAL_LINKS = [
  "privacyPolicy",
  "cookiePolicy",
  "termsOfService",
] as const;

/** c15t's optional categories; the theme can't import @notra/sites-core at runtime. */
export const CONSENT_OPTIONAL_CATEGORIES = [
  "measurement",
  "marketing",
  "functionality",
  "experience",
] as const;
