export const URL_ATTRIBUTE =
  /\b(src|href|poster|content|data-src)=(["'])(\/[^"']*)\2/g;
// srcSet in MDX reaches the page as written.
export const SRCSET_ATTRIBUTE = /\b(srcset)=(?:"([^"]*)"|'([^']*)')/gi;
// Mirrors the url() values Vite rewrites in production CSS.
export const CSS_URL =
  /(?<![\w\-\u0080-\uffff]|@import\s+)(url\(\s*)(["']?)(\/[^"'()]*?)(\2\s*\))/g;
