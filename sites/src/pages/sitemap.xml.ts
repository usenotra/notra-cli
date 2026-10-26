import type { APIRoute } from "astro";

import { allAuthors, authoredBy } from "../lib/authors";
import { getAreaEntries } from "../lib/entries";
import { absoluteUrl, config, href, params } from "../lib/params";
import { collectTags, tagsHref } from "../lib/tags";
import type { BlogEntry, ChangelogEntry } from "../types/entries";
import { isoDate } from "../utils/dates";

function listingUrls(indexable: (BlogEntry | ChangelogEntry)[]): string[] {
  if (config.seo.indexing !== "all" || indexable.length === 0) {
    return [];
  }
  const tags = collectTags(indexable);
  const tagPaths =
    tags.length > 0 ? [tagsHref(), ...tags.map((tag) => tag.href)] : [];
  const posts = indexable.filter(
    (entry): entry is BlogEntry => entry.collection === "blog"
  );
  const authorPaths = allAuthors(posts)
    .filter((author) => posts.some((entry) => authoredBy(entry, author.id)))
    .flatMap((author) => (author.href ? [author.href] : []));
  return [...authorPaths, ...tagPaths].map(
    (path) => `<url><loc>${absoluteUrl(path)}</loc></url>`
  );
}

export const GET: APIRoute = async () => {
  const entries = await getAreaEntries();
  const indexable = params.noindex
    ? []
    : entries.filter(
        (entry) =>
          !(entry.data.draft || ("noindex" in entry.data && entry.data.noindex))
      );
  const lastModified = indexable.map((entry) =>
    "updated" in entry.data && entry.data.updated
      ? entry.data.updated
      : entry.data.date
  );
  const newest = lastModified.reduce<Date | null>(
    (latest, date) => (latest && latest > date ? latest : date),
    null
  );
  const urls = [
    `<url><loc>${absoluteUrl(href())}</loc>${newest ? `<lastmod>${isoDate(newest)}</lastmod>` : ""}</url>`,
    ...indexable.map(
      (entry, index) =>
        `<url><loc>${absoluteUrl(href(entry.id))}</loc><lastmod>${isoDate(lastModified[index] ?? entry.data.date)}</lastmod></url>`
    ),
    ...listingUrls(indexable),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${params.noindex ? "" : urls.join("")}</urlset>`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
