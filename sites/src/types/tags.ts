import type { BlogEntry, ChangelogEntry } from "./entries";

export interface TagLink {
  name: string;
  slug: string;
  href?: string;
  /** Set when the tag is a category tab, so the category bar can filter in place. */
  category?: string;
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

export interface TagLinksProps {
  tags: TagLink[];
  class?: string;
}

export type AreaTag = SiteTag<BlogEntry | ChangelogEntry>;

export type TagPageProps =
  | { kind: "index"; tags: AreaTag[] }
  | { kind: "tag"; tag: AreaTag };
