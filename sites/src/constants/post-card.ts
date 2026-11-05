export const POST_CARD_RADIUS = {
  card: "after:rounded-xl",
  feature: "after:rounded-2xl",
  row: "after:rounded-lg",
  box: "after:rounded-2xl",
} as const;

export const POST_CARD_TAG_LIMIT = 3;

/** Grid cell for a `card` PostCard: hands the list's rows to the card so cover, meta, title, excerpt and authors line up across a row. */
export const POST_CARD_CELL =
  "sm:row-span-5 sm:grid sm:grid-rows-subgrid sm:gap-0";
