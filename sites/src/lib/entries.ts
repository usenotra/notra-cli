import type { SiteArea } from "@notra/sites-core/types/deployment";
import { getCollection } from "astro:content";

import { THEME_AREAS } from "../constants/areas";
import type { BlogEntry, ChangelogEntry, DatedEntry } from "../types/entries";
import { params } from "./params";

const byDateDesc = (a: DatedEntry, b: DatedEntry) =>
  b.data.date.getTime() - a.data.date.getTime();

export async function getBlogRoutes(): Promise<BlogEntry[]> {
  const entries = await getCollection(
    "blog",
    (entry) => params.includeDrafts || !entry.data.draft
  );
  return entries.sort(byDateDesc);
}

export async function getChangelogRoutes(): Promise<ChangelogEntry[]> {
  const entries = await getCollection(
    "changelog",
    (entry) => params.includeDrafts || !entry.data.draft
  );
  return entries.sort(byDateDesc);
}

export async function getBlogEntries(): Promise<BlogEntry[]> {
  return (await getBlogRoutes()).filter((entry) => !entry.data.hidden);
}

export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  return (await getChangelogRoutes()).filter((entry) => !entry.data.hidden);
}

export function getAreaEntries(): Promise<BlogEntry[] | ChangelogEntry[]> {
  return params.area === "blog" ? getBlogEntries() : getChangelogEntries();
}

export async function listedAreas({ keepCurrent = true } = {}): Promise<
  SiteArea[]
> {
  const [blog, changelog] = await Promise.all([
    getBlogEntries(),
    getChangelogEntries(),
  ]);
  const counts: Record<SiteArea, number> = {
    blog: blog.length,
    changelog: changelog.length,
  };
  return THEME_AREAS.filter(
    (area) =>
      Boolean(params.mounts[area]) &&
      (counts[area] > 0 || (keepCurrent && area === params.area))
  );
}
