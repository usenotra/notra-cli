import {
  BLOG_CATEGORY_PARAM,
  BLOG_SEARCH_PARAM,
} from "../constants/blog-filter";
import { tagSlug } from "./tags";

export function matchesBlogFilter(
  categories: string,
  text: string,
  category: string,
  query: string
): boolean {
  return (
    (!category || categories.split(" ").includes(category)) &&
    text.toLowerCase().includes(query.trim().toLowerCase())
  );
}

/** Whether a tag is one of the category tabs that `blog.categories` adds. */
export function isCategoryTag(
  categories: boolean | string[],
  slug: string
): boolean {
  if (categories === false) {
    return false;
  }
  return (
    categories === true || categories.some((name) => tagSlug(name) === slug)
  );
}

/** A click the page may handle itself; other clicks keep the browser's link behavior, like opening a new tab. */
export function isPlainClick(
  event: Pick<
    MouseEvent,
    "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey"
  >
): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** The address of the filtered index, keeping every other part of `href`. */
export function blogFilterUrl(
  href: string,
  category: string,
  query: string
): URL {
  const url = new URL(href);
  for (const [name, value] of [
    [BLOG_CATEGORY_PARAM, category],
    [BLOG_SEARCH_PARAM, query],
  ] as const) {
    if (value) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
  }
  return url;
}
