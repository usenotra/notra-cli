export const EXCERPT_MAX_LENGTH = 160;
export const EXCERPT_CACHE_MAX_ENTRIES = 10_000;
export const EXCERPT_CACHE_MAX_BYTES = 16 * 1024 * 1024;

export const DEFAULT_THEME_COLORS = { light: "#ffffff", dark: "#131316" };

export const TOUCH_ICON_EXTENSIONS = /\.(?:png|jpe?g)$/i;

export const X_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
]);

export const STRUCTURED_DATA_LIST_LIMIT = 50;

export const PROPERTY_META_TAG = /^(?:og|article|fb|profile|book):/i;

export const FEED_MEDIA_NAMESPACE = "http://search.yahoo.com/mrss/";

export const IMAGE_MIME_TYPES: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export const IMAGE_URL_EXTENSION = /\.([a-z0-9]+)$/i;

export const FAQ_HEADING = /^(?:frequently asked questions|faqs?|q\s*&\s*a)$/i;
