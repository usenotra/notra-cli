import type { ListedAuthor } from "../types/authors";
import type { BlogEntry, ChangelogEntry } from "../types/entries";
import type {
  SlotArea,
  SlotAuthor,
  SlotChangelogEntry,
  SlotCommonData,
  SlotPost,
  SlotSite,
} from "../types/site-files";
import { authorSocialLabel } from "../utils/author-social-label";
import { excerpt } from "../utils/excerpt";
import { authorsOf } from "./authors";
import { formatDate } from "./dates";
import {
  absoluteUrl,
  areaDescription,
  areaTitle,
  config,
  href,
  params,
} from "./params";

function slotSite(): SlotSite {
  return { name: config.name, description: config.description };
}

export function slotArea(): SlotArea {
  const path = href();
  return {
    id: params.area,
    title: areaTitle(params.area),
    description: areaDescription(params.area),
    url: absoluteUrl(path),
    path,
  };
}

export function slotCommonData(): SlotCommonData {
  return { site: slotSite(), area: slotArea() };
}

export function slotPost(
  entry: BlogEntry,
  authors = authorsOf(entry)
): SlotPost {
  const path = href(entry.id);
  return {
    title: entry.data.title,
    description: entry.data.description ?? excerpt(entry.body),
    date: formatDate(entry.data.date),
    tags: entry.data.tags,
    authors: authors.map((author) => ({
      name: author.name,
      title: author.title,
      url: author.href ? absoluteUrl(author.href) : author.url,
    })),
    url: absoluteUrl(path),
    path,
  };
}

export function slotAuthor(
  author: ListedAuthor,
  postCount: number
): SlotAuthor {
  const path = author.href ?? href(`author/${author.id}`);
  return {
    id: author.id,
    name: author.name,
    title: author.title,
    bio: author.bio,
    avatar: author.avatar,
    url: author.socials.find((social) => social.kind === "website")?.url,
    href: absoluteUrl(path),
    path,
    socials: author.socials.map((social) => ({
      ...social,
      label: authorSocialLabel(social),
    })),
    postCount,
  };
}

export function slotChangelogEntry(entry: ChangelogEntry): SlotChangelogEntry {
  const path = href(entry.id);
  return {
    title: entry.data.title,
    version: entry.data.version,
    date: formatDate(entry.data.date),
    url: absoluteUrl(path),
    path,
  };
}
