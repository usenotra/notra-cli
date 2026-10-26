import type { BlogCategory } from "../types/categories";
import type { BlogEntry } from "../types/entries";
import { excerpt } from "../utils/excerpt";
import { tagSlug } from "../utils/tags";
import { blogOptions } from "./options";
import { collectTags, entryTags } from "./tags";

export function blogSearchText(entry: BlogEntry): string {
  return [
    entry.data.title,
    entry.data.description ?? excerpt(entry.body),
    ...(entry.data.tags ?? []),
  ].join(" ");
}

export function blogCategories(entries: BlogEntry[]): BlogCategory[] {
  const setting = blogOptions.categories;
  if (setting === false) {
    return [];
  }
  const tags = collectTags(entries);
  if (setting === true) {
    return tags.map(({ name, slug }) => ({ name, slug }));
  }
  const used = new Set(tags.map((tag) => tag.slug));
  const seen = new Set<string>();
  const categories: BlogCategory[] = [];
  for (const name of setting) {
    const slug = tagSlug(name);
    if (used.has(slug) && !seen.has(slug)) {
      seen.add(slug);
      categories.push({ name, slug });
    }
  }
  return categories;
}

export function entryCategorySlugs(
  entry: BlogEntry,
  categories: BlogCategory[]
): string {
  const slugs = new Set(categories.map((category) => category.slug));
  return entryTags(entry)
    .map((tag) => tag.slug)
    .filter((slug) => slugs.has(slug))
    .join(" ");
}
