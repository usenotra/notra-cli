import type { APIRoute } from "astro";

import type { AreaPages } from "../../compiler/types/agent-files";
import { authorsOf } from "../lib/authors";
import { getBlogRoutes, getChangelogRoutes } from "../lib/entries";
import { areaDescription, areaTitle, href, params } from "../lib/params";
import { isoDate } from "../utils/dates";
import { excerpt } from "../utils/excerpt";

export const GET: APIRoute = async () => {
  const common = {
    area: params.area,
    title: areaTitle(params.area),
    description: areaDescription(params.area),
  };
  const entries =
    params.area === "blog"
      ? (await getBlogRoutes()).map((entry) => ({
          path: href(entry.id),
          title: entry.data.title,
          description: entry.data.description,
          summary: excerpt(entry.body),
          date: isoDate(entry.data.date),
          updated: entry.data.updated ? isoDate(entry.data.updated) : undefined,
          authors: authorsOf(entry).map((author) => author.name),
          tags: entry.data.tags,
          hidden: entry.data.hidden,
          indexable: !(
            entry.data.hidden ||
            entry.data.draft ||
            entry.data.noindex
          ),
        }))
      : (await getChangelogRoutes()).map((entry) => ({
          path: href(entry.id),
          title: entry.data.title,
          description: entry.data.description,
          summary: excerpt(entry.body),
          date: isoDate(entry.data.date),
          version: entry.data.version,
          tags: entry.data.tags,
          hidden: entry.data.hidden,
          indexable: !(entry.data.hidden || entry.data.draft),
        }));
  return new Response(
    JSON.stringify({
      ...common,
      indexPath: href(),
      entries,
    } satisfies AreaPages),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
