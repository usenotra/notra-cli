import type { AuthorProfileKind } from "../types/authors";

/** Profile link fields an author can set, in the order the theme lists them. */
export const AUTHOR_PROFILE_FIELDS = [
  "x",
  "linkedin",
  "github",
  "youtube",
  "bluesky",
  "mastodon",
  "threads",
  "instagram",
] as const;

export const AUTHOR_SOCIAL_LABELS: Record<AuthorProfileKind, string> = {
  x: "X",
  linkedin: "LinkedIn",
  github: "GitHub",
  youtube: "YouTube",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  threads: "Threads",
  instagram: "Instagram",
};

export const WWW_PREFIX = /^www\./;
