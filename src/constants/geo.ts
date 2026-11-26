export const GEO_SNAPSHOT_ITEM_LIMIT = 5;
export const GEO_SNAPSHOT_OPTIONAL_TIMEOUT_MS = 5_000;

// Labels match the dashboard's "Why AI picks you" card.
export const GEO_PICK_REASON_LABELS: Readonly<Record<string, string>> = {
  price: 'Price',
  reviews: 'Reviews',
  features: 'Features',
  integrations: 'Integrations',
  ease_of_use: 'Easy to use',
  support: 'Support',
  security: 'Security',
  performance: 'Performance',
  availability: 'In stock',
  delivery: 'Delivery',
  trial_refunds: 'Trial & refunds',
  brand: 'Brand name',
};

export const GEO_PICK_LABELS: Readonly<Record<string, string>> = {
  top_pick: 'Top pick',
  recommended: 'Recommended',
};

export const GEO_PICK_REASONS_SHOWN = 3;
