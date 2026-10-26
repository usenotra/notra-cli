import { COMBINING_MARKS, EDGE_DASHES, NON_WORD_RUN } from "../constants/tags";

export function tagSlug(tag: string): string {
  return tag
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(NON_WORD_RUN, "-")
    .replace(EDGE_DASHES, "");
}
