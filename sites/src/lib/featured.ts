import { EDGE_SLASHES, FRONTMATTER_FEATURED_LIMIT } from "../constants/entries";
import type { BlogEntry, FeaturedEntries } from "../types/entries";

function pickFeatured(
  entries: BlogEntry[],
  featured: "latest" | "none" | string[]
): BlogEntry[] {
  if (featured === "latest") {
    return entries.slice(0, 1);
  }
  if (Array.isArray(featured)) {
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    return [...new Set(featured)]
      .map((slug) => byId.get(slug.replace(EDGE_SLASHES, "")))
      .filter((entry): entry is BlogEntry => entry !== undefined);
  }
  return entries
    .filter((entry) => entry.data.featured)
    .slice(0, FRONTMATTER_FEATURED_LIMIT);
}

export function splitFeatured(
  entries: BlogEntry[],
  featured: "latest" | "none" | string[]
): FeaturedEntries {
  const picked = pickFeatured(entries, featured);
  const ids = new Set(picked.map((entry) => entry.id));
  return {
    featured: picked,
    rest: entries.filter((entry) => !ids.has(entry.id)),
  };
}
