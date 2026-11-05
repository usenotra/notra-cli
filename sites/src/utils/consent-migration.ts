import { readStoredRecordsFromCookieHeader } from "@c15t/core/modules/persistence";

import { CONSENT_OPTIONAL_CATEGORIES } from "../constants/consent";

const LEGACY_KEY = "c15t";
const MIGRATED_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function refuses(cookieHeader: string, now: number): boolean {
  const { choice } = readStoredRecordsFromCookieHeader(
    cookieHeader,
    undefined,
    now
  );
  return Object.values(choice?.categories ?? {}).some(
    (decision) => decision?.value === false
  );
}

/**
 * Carries a refusal stored under c15t's default `c15t` key over to the
 * host-only key. Any other site on the hosting domain can set the `c15t`
 * cookie, so a stored value may only take consent away: a refusal of any
 * category in any `c15t` cookie or in this origin's `c15t` localStorage
 * record becomes a refusal of every optional category, and a grant is never
 * carried over. It runs until the host-only cookie exists, so a refusal also
 * wins over a choice c15t kept only in localStorage.
 */
export function migrateLegacyRefusal(storageKey: string | null): void {
  if (!storageKey || typeof document === "undefined") {
    return;
  }
  const cookies = document.cookie.split(/;\s*/);
  if (cookies.some((cookie) => cookie.startsWith(`${storageKey}=`))) {
    return;
  }
  const now = Date.now();
  const candidates = [
    ...cookies.filter((cookie) => cookie.startsWith(`${LEGACY_KEY}=`)),
    `${LEGACY_KEY}=${encodeURIComponent(readLocalStorage(LEGACY_KEY) ?? "")}`,
  ];
  if (!candidates.some((candidate) => refuses(candidate, now))) {
    return;
  }
  const record = {
    consents: {
      necessary: true,
      ...Object.fromEntries(
        CONSENT_OPTIONAL_CATEGORIES.map((name) => [name, false])
      ),
    },
    consentInfo: { time: now, type: "necessary" },
  };
  document.cookie = `${storageKey}=${encodeURIComponent(JSON.stringify(record))}; Path=/; Max-Age=${MIGRATED_MAX_AGE_SECONDS}; Secure; SameSite=Lax`;
}

/**
 * A site that shares its consent choice across its own subdomains pins the
 * `c15t` cookie to its own domain, so on its hosting-domain address c15t keeps
 * the choice in this origin's localStorage. Any other site there can still set
 * `c15t` on the hosting domain, so that cookie is expired before c15t reads it.
 */
export function dropSharedConsentCookie(hostingDomain: string): void {
  document.cookie = `${LEGACY_KEY}=; Domain=.${hostingDomain}; Path=/; Max-Age=0`;
}
