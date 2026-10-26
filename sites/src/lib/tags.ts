import { TAG_ENTRY_NOUNS } from "../constants/tags";
import type { BlogEntry, ChangelogEntry } from "../types/entries";
import type { SiteTag, TagLink } from "../types/tags";
import { tagSlug } from "../utils/tags";
import { href, params } from "./params";

export function tagsHref(): string {
  return href("tags");
}

function tagLink(name: string, slug: string): TagLink {
  return { name, slug, href: href(`tags/${slug}`) };
}

export function entryTags(
  entry: BlogEntry | ChangelogEntry,
  listedEntries?: (BlogEntry | ChangelogEntry)[]
): TagLink[] {
  const listedSlugs = listedEntries
    ? new Set(listedEntries.flatMap((listed) => listed.data.tags.map(tagSlug)))
    : null;
  const seen = new Set<string>();
  const links: TagLink[] = [];
  for (const name of entry.data.tags) {
    const slug = tagSlug(name);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      const link = tagLink(name.trim(), slug);
      if (listedSlugs && !listedSlugs.has(slug)) {
        link.href = undefined;
      }
      links.push(link);
    }
  }
  return links;
}

export function collectTags<Entry extends BlogEntry | ChangelogEntry>(
  entries: Entry[]
): SiteTag<Entry>[] {
  const tags = new Map<string, SiteTag<Entry>>();
  for (const entry of entries) {
    for (const link of entryTags(entry)) {
      const tag = tags.get(link.slug) ?? {
        ...link,
        href: href(`tags/${link.slug}`),
        entries: [],
      };
      tag.entries.push(entry);
      tags.set(link.slug, tag);
    }
  }
  return [...tags.values()].sort(
    (a, b) =>
      b.entries.length - a.entries.length || a.name.localeCompare(b.name)
  );
}

export function entryCount(count: number): string {
  const nouns = TAG_ENTRY_NOUNS[params.area];
  return `${count} ${count === 1 ? nouns.one : nouns.other}`;
}
