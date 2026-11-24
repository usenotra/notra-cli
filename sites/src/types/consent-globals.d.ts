import type { SiteConsentAnalytics } from "./build-params";

declare global {
  const __NOTRA_CONSENT_ANALYTICS__: SiteConsentAnalytics;
  const __NOTRA_CONSENT_STORAGE_KEY__: string | null;
  const __NOTRA_HOSTING_DOMAIN__: string | null;
}
