import { AUTHOR_SOCIAL_LABELS, WWW_PREFIX } from "../constants/authors";
import type { AuthorSocial } from "../types/authors";

export function authorSocialLabel(social: AuthorSocial): string {
  return social.kind === "website"
    ? new URL(social.url).hostname.replace(WWW_PREFIX, "")
    : AUTHOR_SOCIAL_LABELS[social.kind];
}
