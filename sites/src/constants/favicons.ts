// Mirrors SITE_FAVICON_DIR and SITE_FAVICON_HOST in @notra/sites-core, which
// the theme can't import at runtime; tests/favicons.test.ts keeps them equal.
export const FAVICON_DIR = "_notra/favicon";
export const FAVICON_HOST = /^(?=.{1,253}$)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
