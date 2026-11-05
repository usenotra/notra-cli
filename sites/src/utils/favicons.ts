import type { SiteConfig } from "@notra/sites-core/types/site-config";

import { FAVICON_HOST } from "../constants/favicons";

export function faviconHost(url: string): string | null {
  if (!URL.canParse(url)) {
    return null;
  }
  const { protocol, hostname } = new URL(url);
  return (protocol === "https:" || protocol === "http:") &&
    FAVICON_HOST.test(hostname)
    ? hostname
    : null;
}

/** The website social has no brand mark, so the footer shows its favicon. */
export function socialFaviconHost(
  platform: string,
  url: string
): string | null {
  return platform === "website" ? faviconHost(url) : null;
}

/** Host the footer shows a favicon for; the worker serves no other. */
export function footerFaviconHost(config: SiteConfig): string | undefined {
  const website = config.footer.socials.website;
  return (website && faviconHost(website)) || undefined;
}
