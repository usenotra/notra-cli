export const URL_ATTRIBUTE =
  /\b(src|href|poster|content|data-src)=(["'])(\/[^"']*)\2/g;
export const SRCSET_ATTRIBUTE = /\bsrcset=(["'])([^"']*)\1/g;
// Mirrors the url() values Vite rewrites in production CSS.
export const CSS_URL =
  /(?<![\w\-\u0080-\uffff]|@import\s+)(url\(\s*)(["']?)(\/[^"'()]*?)(\2\s*\))/g;
