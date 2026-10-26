import type { SITE_SLOT_NAMES } from "@notra/sites-core/constants/site-layout";

export type SlotName = (typeof SITE_SLOT_NAMES)[number];

export interface SiteMdxModule {
  default: (props: Record<string, unknown>) => unknown;
}

export interface SlotSite {
  name: string;
  description?: string;
}

export interface SlotArea {
  id: "blog" | "changelog";
  title: string;
  description?: string;
  url: string;
}

export interface SlotPost {
  title: string;
  description?: string;
  date: string;
  tags: string[];
  authors: { name: string; title?: string; url?: string }[];
  url: string;
}

export interface SlotChangelogEntry {
  title: string;
  version?: string;
  date: string;
  url: string;
}

/** The kind of page being rendered, passed to header.mdx, footer.mdx and page-wide slots. */
export type SitePageKind = "index" | "entry" | "author" | "tag" | "not-found";

export interface SitePageContext {
  page: SitePageKind;
  area: "blog" | "changelog";
  path: string;
}

export interface CustomChromeProps {
  part: "header" | "footer";
  context: SitePageContext;
}

export interface SiteSlotProps {
  name: SlotName;
  data?: Record<string, unknown>;
  class?: string;
}
