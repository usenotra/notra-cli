import type { BlogEntry, ChangelogEntry } from "./entries";

export interface TagLink {
  name: string;
  slug: string;
  href?: string;
}

export interface SiteTag<
  Entry extends BlogEntry | ChangelogEntry,
> extends TagLink {
  href: string;
  entries: Entry[];
}

export interface TagListProps {
  tags: TagLink[];
  class?: string;
  overlay?: boolean;
}

export type AreaTag = SiteTag<BlogEntry | ChangelogEntry>;

export type TagPageProps =
  | { kind: "index"; tags: AreaTag[] }
  | { kind: "tag"; tag: AreaTag };
