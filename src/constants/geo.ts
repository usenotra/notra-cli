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

/** Labels for the kinds of request pick rates are split by, as the dashboard names them. */
export const GEO_PICK_REQUEST_LABELS: Readonly<Record<string, string>> = {
  all: 'All requests',
  budget: 'Budget',
  small_team: 'Small team',
  beginner: 'Beginner or easy',
  enterprise: 'Enterprise or scale',
  pro: 'Pro-level or heavy use',
  integrations: 'Integrations',
  speed: 'Speed',
  industry: 'Industry or audience',
  none: 'No specific need',
};

/** Below this many answers a request row shows no rates. */
export const GEO_PICK_REQUESTS_MIN_ANSWERS = 5;
