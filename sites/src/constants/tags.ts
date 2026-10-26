export const TAG_ENTRY_NOUNS = {
  blog: { one: "post", other: "posts" },
  changelog: { one: "update", other: "updates" },
} as const;

export const COMBINING_MARKS = /\p{M}+/gu;

export const NON_WORD_RUN = /[^\p{L}\p{N}]+/gu;

export const EDGE_DASHES = /^-+|-+$/g;
