import type { APIRoute } from "astro";

import { FEED_MEDIA_NAMESPACE } from "../constants/seo";
import { authorNamesOf } from "../lib/authors";
import { getAreaEntries } from "../lib/entries";
import {
  absoluteUrl,
  areaDescription,
  assetUrl,
  areaTitle,
  href,
  namedAreaTitle,
  params,
} from "../lib/params";
import { excerpt } from "../utils/excerpt";
import { imageMimeType } from "../utils/images";
import { escapeXml } from "../utils/xml";

function coverMedia(image: string | undefined, alt: string | undefined) {
  const path = assetUrl(image);
  if (!path) {
    return "";
  }
  const url = absoluteUrl(path);
  const type = imageMimeType(url);
  const typeAttribute = type ? ` type="${type}"` : "";
  const caption = alt
    ? `<media:description type="plain">${escapeXml(alt)}</media:description>`
    : "";
  return `<media:content url="${escapeXml(url)}" medium="image"${typeAttribute}>${caption}</media:content>`;
}

export const GET: APIRoute = async () => {
  const entries = await getAreaEntries();
  const published = entries.filter((entry) => !entry.data.draft);
  const items = published
    .map((entry) => {
      const link = absoluteUrl(href(entry.id));
      const summary = entry.data.description ?? excerpt(entry.body);
      const description = summary
        ? `<description>${escapeXml(summary)}</description>`
        : "";
      const creators = authorNamesOf(entry)
        .map((name) => `<dc:creator>${escapeXml(name)}</dc:creator>`)
        .join("");
      const categories = entry.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("");
      return `<item><title>${escapeXml(entry.data.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${entry.data.date.toUTCString()}</pubDate>${description}${creators}${categories}${coverMedia(entry.data.image, entry.data.imageAlt)}</item>`;
    })
    .join("");
  const lastBuild = published[0]
    ? `<lastBuildDate>${published[0].data.date.toUTCString()}</lastBuildDate>`
    : "";
  const channelLink = absoluteUrl(href());
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="${FEED_MEDIA_NAMESPACE}"><channel><title>${escapeXml(namedAreaTitle(params.area))}</title><link>${channelLink}</link><description>${escapeXml(areaDescription(params.area) ?? areaTitle(params.area))}</description><language>en</language>${lastBuild}<atom:link href="${absoluteUrl(href("feed.xml"))}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
