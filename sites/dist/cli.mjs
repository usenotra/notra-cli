#!/usr/bin/env node

// compiler/cli.ts
import { randomBytes as randomBytes2 } from "node:crypto";
import { renameSync, watch as watch2 } from "node:fs";
import { mkdtemp as mkdtemp2, realpath, rm as rm5, writeFile as writeFile3 } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as join10, resolve as resolve2 } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// ../../packages/sites-compiler/src/utils/diagnostics.ts
function hasErrors(diagnostics) {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

// ../../packages/sites-core/src/constants/site-layout.ts
var SITE_NAVBAR_LINK_TYPES = [
  "github",
  "discord",
  "x",
  "linkedin",
  "youtube",
  "slack"
];
var SITE_SOCIAL_PLATFORMS = [
  "x",
  "github",
  "linkedin",
  "youtube",
  "discord",
  "slack",
  "instagram",
  "facebook",
  "bluesky",
  "threads",
  "reddit",
  "medium",
  "telegram",
  "hacker-news",
  "website"
];
var SITE_CONTEXTUAL_OPTIONS = [
  "copy",
  "view",
  "chatgpt",
  "claude",
  "t3chat",
  "perplexity",
  "grok"
];
var SITE_CHROME_FILES = ["header.mdx", "footer.mdx"];
var SITE_SLOTS_DIR = "slots";
var SITE_SLOT_NAMES = [
  "blog-hero",
  "changelog-hero",
  "before-post",
  "after-post",
  "sidebar",
  "after-changelog-entry",
  "before-footer"
];

// ../../packages/sites-core/src/constants/sites.ts
var SITE_AREAS = ["blog", "changelog"];
var SITE_CONFIG_FILENAME = "blog.json";
var SITE_ASSETS_DIR = "_notra/assets";
var SITE_RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "assets",
  "cdn",
  "docs",
  "mail",
  "notra",
  "preview",
  "previews",
  "static",
  "status"
]);
var SITE_UNAVAILABLE_SLUGS = new Set([
  "abuse",
  "account",
  "accounts",
  "auth",
  "autoconfig",
  "autodiscover",
  "billing",
  "cname",
  "console",
  "dashboard",
  "fallback",
  "help",
  "ingest",
  "login",
  "mta-sts",
  "origin",
  "security",
  "signin",
  "sites",
  "support"
]);
var SITE_MOUNT_MAX_SEGMENTS = 3;
var SITE_PREVIEW_SESSION_SECONDS = 60 * 60 * 12;
var SITE_PREVIEW_MEMBER_SESSION_SECONDS = 60 * 60;
var SITE_PREVIEW_MEMBER_RENEW_SECONDS = 60 * 60 * 24 * 7;
var SITE_PREVIEW_SHARE_LINK_SECONDS = 60 * 60 * 24 * 7;
var POST_PREVIEW_LIFETIMES = {
  "1h": 60 * 60,
  "1d": 60 * 60 * 24,
  "3d": 60 * 60 * 24 * 3,
  "7d": 60 * 60 * 24 * 7
};
var SITE_PREVIEW_PASSWORD_ALGORITHM = "PBKDF2-SHA256";
var SITE_BUILD_LIMITS = {
  buildTimeoutSeconds: 10 * 60,
  maxOutputBytes: 500 * 1024 * 1024,
  maxOutputFiles: 20000,
  maxSingleFileBytes: 25 * 1024 * 1024,
  maxSourceBytes: 200 * 1024 * 1024,
  maxSourceFiles: 1e4,
  maxBuildLogBytes: 512 * 1024,
  maxConcurrentBuilds: 20,
  maxConcurrentBuildsPerSite: 2,
  maxDeploymentsPerOrganizationPerDay: 300
};
var SITE_SOURCE_ROOT_ENTRIES = [
  SITE_CONFIG_FILENAME,
  "blog",
  "changelog",
  "snippets",
  "public",
  "style.css",
  "styles",
  "script.js",
  "scripts",
  ...SITE_CHROME_FILES,
  SITE_SLOTS_DIR
];
var SITE_SOURCE_ROOTS = new Set(SITE_SOURCE_ROOT_ENTRIES);
var SITE_CUSTOM_SCRIPT_FILENAME = "script.js";
var SITE_CUSTOM_SCRIPTS_DIR = "scripts";
var SITE_SOURCE_EXTENSIONS = [
  ".md",
  ".mdx",
  ".jsx",
  ".js",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".ico",
  ".mp4",
  ".webm",
  ".pdf",
  ".txt",
  ".woff",
  ".woff2",
  ".css",
  ".riv",
  ".wasm"
];
var SITE_INJECTED_REACT_HOOKS = [
  "useState",
  "useEffect",
  "useRef",
  "useCallback",
  "useMemo",
  "useContext",
  "useReducer",
  "useId",
  "useLayoutEffect",
  "useTransition",
  "useDeferredValue"
];
var SITE_PREVIEW_VISIBILITIES = ["public", "protected"];
var SITE_STATUSES = ["active", "suspended"];
var SITE_ENGAGEMENT_MAX_VISIBLE_MS = 30 * 60 * 1000;

// ../../packages/sites-core/src/constants/source.ts
var SITE_IGNORE_FILENAME = ".notraignore";
var SITE_IGNORE_MAX_BYTES = 512 * 1024;
var SITE_SOURCE_ALLOWED_EXTENSIONS = new Set(SITE_SOURCE_EXTENSIONS);
var SITE_SOURCE_SAFE_SEGMENT = /^[A-Za-z0-9._@()+ -]+$/;

// ../../packages/sites-core/src/constants/site-config.ts
var SITE_HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
var SITE_LINK_HREF = /^(?:\/(?!\/)|https?:\/\/|mailto:)/;
var SITE_ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var SITE_AUTHOR_ID = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
var SITE_AUTHOR_AVATAR = /^(?:\/(?!\/)|https:\/\/)/;
var SITE_DEFAULT_PRIMARY_COLOR = "#8B5CF6";
var SITE_APPEARANCE_STORAGE_KEY = /^[A-Za-z0-9._-]{1,64}$/;
var SITE_DEFAULT_APPEARANCE_STORAGE_KEY = "notra-theme";

// ../../packages/sites-core/src/constants/integrations.ts
var UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
var UMAMI_CONNECT_ORIGIN = "https://gateway.umami.is";
var GOOGLE_TAG_ORIGIN = "https://www.googletagmanager.com";
var GOOGLE_ANALYTICS_CONNECT_ORIGINS = [
  GOOGLE_TAG_ORIGIN,
  "https://*.google-analytics.com",
  "https://*.google.com"
];
var GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{4,16}$/;
var DATABUDDY_SCRIPT_URL = "https://cdn.databuddy.cc/databuddy.js";
var DATABUDDY_API_URL = "https://basket.databuddy.cc";
var DATABUDDY_CLIENT_ID = /^[A-Za-z0-9_-]{8,64}$/;
var DATABUDDY_CLIENT_ID_MESSAGE = "Copy the Client ID from your Databuddy website settings";
var DATABUDDY_PATH_PATTERN = /^\/[^\s"'<>]{0,199}$/;
var DATABUDDY_MAX_PATH_PATTERNS = 50;
var DATABUDDY_MAX_BATCH_SIZE = 50;
var DATABUDDY_MAX_RETRIES = 10;
var DATABUDDY_MAX_DELAY_MS = 60000;
var CAMEL_CASE_BOUNDARY = /[A-Z]/g;
var TRAILING_SLASHES = /\/+$/;
var PLAUSIBLE_SCRIPT_URL = "https://plausible.io/js/script.js";
var POSTHOG_DEFAULT_API_HOST = "https://us.i.posthog.com";
var POSTHOG_CSP_ORIGIN = "https://*.posthog.com";
var POSTHOG_LOADER = '!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);';
var HOST = String.raw`(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}`;
var PORT = String.raw`(?::(?:\d{1,4}|[0-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))?`;
var HOSTNAME = new RegExp(`^${HOST}$`);
var HOSTNAME_WITH_PORT = new RegExp(`^${HOST}${PORT}$`);
var HTTPS_BASE_URL = new RegExp(String.raw`^https:\/\/${HOST}${PORT}(?:\/[A-Za-z0-9._~-]+)*\/*$`);
var HTTPS_SCRIPT_URL = new RegExp(String.raw`^https:\/\/${HOST}${PORT}(?:\/(?!\.{1,2}(?:\/|$))[A-Za-z0-9._~-]+)+$`);
var CSP_ORIGIN = new RegExp(String.raw`^(?:https|wss):\/\/(?:\*\.)?${HOST}${PORT}$`);
var POSTHOG_API_KEY = /^phc_[A-Za-z0-9]{20,64}$/;
var C15T_SCRIPT_CATEGORIES = [
  "measurement",
  "marketing",
  "functionality",
  "experience"
];
var C15T_SCRIPT_PATH = /^(?!\/)(?!.*\.\.)[\w./-]+\.js$/i;
var C15T_LOCALES = [
  "bg",
  "cs",
  "cy",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "fi",
  "fr",
  "ga",
  "gu",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "is",
  "it",
  "lb",
  "lt",
  "lv",
  "mt",
  "nb",
  "nl",
  "nn",
  "pl",
  "pt",
  "rm",
  "ro",
  "sk",
  "sl",
  "sv",
  "zh"
];
var C15T_ACTION_DIRECTIONS = ["row", "column"];
var C15T_UI_PROFILES = ["compact", "balanced", "strict"];
var C15T_FLOATING_POSITIONS = [
  "bottom-left",
  "bottom-right",
  "top-left",
  "top-right",
  "bottom-center",
  "top-center"
];
var C15T_BAR_POSITIONS = ["top", "bottom"];
var C15T_WIDGET_POSITIONS = [
  "bottom-left",
  "bottom-right",
  "top-left",
  "top-right"
];
var C15T_STORAGE_MAX_EXPIRY_DAYS = 730;
var C15T_COLOR_TOKENS = [
  "primary",
  "primaryHover",
  "textOnPrimary",
  "surface",
  "surfaceHover",
  "border",
  "borderHover",
  "text",
  "textMuted",
  "overlay",
  "switchTrack",
  "switchTrackActive",
  "switchThumb"
];
var C15T_RADII = ["none", "small", "medium", "large"];

// ../../packages/sites-core/src/constants/security.ts
var SITE_CSP_MAX_SCRIPT_HASHES = 100;
var SITE_CSP_MAX_LENGTH = 16384;
var SITE_CSP_MAX_ALLOWED_ORIGINS = 32;
var SITE_CSP_STATIC_DIRECTIVES = [
  "object-src 'none'",
  "base-uri 'self'"
];

// ../../packages/sites-core/src/schemas/site-integrations.ts
import { z } from "zod";
var httpsScriptUrlSchema = z.string().trim().regex(HTTPS_SCRIPT_URL, "Use the full https:// script URL including its path, without query or hash").optional();
var httpsBaseUrlSchema = z.string().trim().regex(HTTPS_BASE_URL, "Use an https:// URL without query or hash").overwrite((value) => value.replace(TRAILING_SLASHES, "")).optional();
var optionalBooleanSchema = z.boolean().optional();
var ga4Schema = z.strictObject({
  measurementId: z.string({ error: "Use the measurement ID (G-…)" }).trim().regex(GA4_MEASUREMENT_ID, "Use the measurement ID (G-…)").describe("Google Analytics 4 web stream Measurement ID (G-…). Find it in Admin > Data streams > your web stream.")
});
var plausibleSchema = z.strictObject({
  domain: z.string({ error: "Use the domain as added in Plausible, e.g. acme.com" }).trim().toLowerCase().regex(HOSTNAME, "Use the domain as added in Plausible, e.g. acme.com").describe("Site domain registered in Plausible, without https:// (e.g. docs.acme.com)."),
  server: z.string().trim().toLowerCase().regex(HOSTNAME_WITH_PORT, "Use a hostname with an optional port, without https://, e.g. plausible.acme.com:8443").optional().describe("Self-hosted Plausible hostname with an optional port, without https://. Omit to use plausible.io.")
});
var posthogSchema = z.strictObject({
  apiKey: z.string({ error: "Use the project API key (phc_…)" }).trim().regex(POSTHOG_API_KEY, "Use the project API key (phc_…)").describe("Public PostHog project API key (phc_…), not a personal API key."),
  apiHost: httpsBaseUrlSchema.describe("PostHog ingestion URL. Defaults to https://us.i.posthog.com; use https://eu.i.posthog.com for EU Cloud or your self-hosted HTTPS endpoint."),
  sessionRecording: optionalBooleanSchema.describe("Enable session recording (default: true). Authorize your site domain in PostHog project settings. Set false to keep analytics without recordings.")
});
var umamiSchema = z.strictObject({
  websiteId: z.string({ error: "Copy the Website ID from Umami's tracking code" }).trim().uuid("Copy the Website ID from Umami's tracking code").describe("Public Umami Website ID (UUID) from your website's Tracking code. No API key is needed."),
  scriptUrl: httpsScriptUrlSchema.describe("Tracker script URL including a non-root path. Defaults to https://cloud.umami.is/script.js; use your self-hosted HTTPS script URL when needed."),
  hostUrl: httpsBaseUrlSchema.describe("Optional collection endpoint base URL (data-host-url). Only needed when events should go to a different endpoint, such as a reverse proxy.")
});
var c15tSurfaceSchema = {
  direction: z.enum(C15T_ACTION_DIRECTIONS).optional().describe("Lay the buttons out in a row (default) or a column."),
  uiProfile: z.enum(C15T_UI_PROFILES).optional().describe("compact (default) sizes buttons to their labels; balanced and strict stretch every button to full width.")
};
var c15tPromptSchema = z.discriminatedUnion("variant", [
  z.strictObject({
    variant: z.literal("floating"),
    position: z.enum(C15T_FLOATING_POSITIONS).optional(),
    blocking: z.boolean().optional(),
    ...c15tSurfaceSchema
  }),
  z.strictObject({
    variant: z.literal("bar"),
    position: z.enum(C15T_BAR_POSITIONS).optional(),
    blocking: z.boolean().optional(),
    ...c15tSurfaceSchema
  }),
  z.strictObject({
    variant: z.literal("widget"),
    position: z.enum(C15T_WIDGET_POSITIONS).optional(),
    blocking: z.boolean().optional(),
    ...c15tSurfaceSchema
  }),
  z.strictObject({ variant: z.literal("wall"), ...c15tSurfaceSchema })
]).describe("Shape and position of the consent banner. floating is a card, bar spans the viewport edge, widget is a compact corner card, wall blocks the page until the visitor chooses.");
var c15tLegalLinkSchema = z.strictObject({
  href: z.string().trim().regex(SITE_LINK_HREF, "Use an absolute https:// URL or a path"),
  label: z.string().trim().min(1).max(80).optional().describe("Link text. Defaults to the translated name of the link.")
});
var c15tColorsSchema = z.partialRecord(z.enum(C15T_COLOR_TOKENS), z.string().regex(SITE_HEX_COLOR, "Use a hex color like #8B5CF6"));
var c15tSchema = z.strictObject({
  backendURL: z.string({
    error: "Use your Inth project URL or self-hosted c15t backend, e.g. https://acme.inth.app"
  }).trim().regex(HTTPS_BASE_URL, "Use an https:// URL without query or hash").overwrite((value) => value.replace(/\/+$/, "")).describe("Your Inth project URL (https://your-project.inth.app) or the URL of your self-hosted c15t backend, including any path prefix. Visitors save consent there."),
  scripts: z.record(z.string().regex(C15T_SCRIPT_PATH, "Use the script's path in your repository, like scripts/hotjar.js"), z.enum(C15T_SCRIPT_CATEGORIES)).optional().describe('Custom scripts that load only after the visitor allows a category, keyed by their path, like { "scripts/hotjar.js": "measurement" }. Scripts you leave out load on every page.'),
  prompt: c15tPromptSchema.optional(),
  preferences: z.strictObject({
    blocking: z.boolean().optional().describe("Dim the page and trap focus while open (default: true)."),
    ...c15tSurfaceSchema
  }).optional().describe("Layout of the privacy settings dialog."),
  legalLinks: z.strictObject({
    privacyPolicy: c15tLegalLinkSchema.optional(),
    cookiePolicy: c15tLegalLinkSchema.optional(),
    termsOfService: c15tLegalLinkSchema.optional()
  }).optional().describe("Legal pages linked from the banner and the dialog."),
  locale: z.enum(C15T_LOCALES).optional().describe("Force the banner language. Omit to follow the visitor's browser language."),
  crossSubdomain: z.boolean().optional().describe("Share the consent cookie with every subdomain of the site's domain (default: false)."),
  expiryDays: z.number().int().min(1).max(C15T_STORAGE_MAX_EXPIRY_DAYS).optional().describe("Days until the stored choice expires (default: 365)."),
  disableAnimation: z.boolean().optional().describe("Show the banner and dialog without animations."),
  theme: z.strictObject({
    colors: c15tColorsSchema.optional().describe("Light mode colors as hex values. Unset colors follow your site's theme."),
    dark: c15tColorsSchema.optional().describe("Dark mode colors as hex values. Unset colors follow your site's dark theme."),
    radius: z.enum(C15T_RADII).optional().describe("Corner rounding of the banner, dialog and buttons (default: medium).")
  }).optional().describe("Banner and dialog styling. By default they use your site's colors, fonts and dark mode."),
  hideBranding: z.boolean().optional().describe("Hide the 'Secured by c15t' badge on the banner. Check that your Inth plan allows it."),
  devTools: z.boolean().default(true).describe("Show the c15t DevTools panel during local development with notra-sites dev (default: true). Never included in previews or the live site.")
}).describe("c15t cookie banner and privacy settings, backed by Inth or your self-hosted c15t backend. Live deployments only; previews and local development show the banner without saving consent.");
var databuddyPathPatternsSchema = z.array(z.string().trim().regex(DATABUDDY_PATH_PATTERN, "Use a path glob starting with /, e.g. /changelog/*")).max(DATABUDDY_MAX_PATH_PATTERNS);
var databuddyDelaySchema = z.number().int().min(0).max(DATABUDDY_MAX_DELAY_MS);
var databuddySchema = z.strictObject({
  clientId: z.string({ error: DATABUDDY_CLIENT_ID_MESSAGE }).trim().regex(DATABUDDY_CLIENT_ID, DATABUDDY_CLIENT_ID_MESSAGE).describe("Public Databuddy Client ID from your website's tracking code (data-client-id). No API key is needed."),
  scriptUrl: httpsScriptUrlSchema.describe("Tracker script URL. Defaults to https://cdn.databuddy.cc/databuddy.js; set it for a self-hosted or proxied script."),
  apiUrl: httpsBaseUrlSchema.describe("Event ingestion URL. Defaults to https://basket.databuddy.cc; set it for a self-hosted or proxied endpoint."),
  trackWebVitals: optionalBooleanSchema.describe("Send Core Web Vitals (LCP, CLS, INP, FCP, TTFB) for each page (default: false)."),
  trackErrors: optionalBooleanSchema.describe("Send uncaught JavaScript errors (default: false)."),
  trackOutgoingLinks: optionalBooleanSchema.describe("Send an event when visitors click links to other domains (default: false)."),
  trackInteractions: optionalBooleanSchema.describe("Send clicks, rage clicks and dead clicks (default: false)."),
  trackAttributes: optionalBooleanSchema.describe("Send a custom event when visitors click elements with a data-track attribute, using other data-* attributes as properties (default: false)."),
  trackHashChanges: optionalBooleanSchema.describe("Count URL hash changes as page views (default: false)."),
  samplingRate: z.number().min(0).max(1).optional().describe("Share of events to send, from 0 to 1 (default: 1)."),
  skipPatterns: databuddyPathPatternsSchema.optional().describe('Path globs that are never tracked, e.g. ["/drafts/**"].'),
  maskPatterns: databuddyPathPatternsSchema.optional().describe('Path globs whose matching segments are masked before sending, e.g. ["/authors/*"].'),
  anonymizeVisitorIds: z.union([z.boolean(), z.literal("auto")]).optional().describe('Anonymize visitor IDs before storage, or "auto" to let Databuddy decide (default: true).'),
  ignoreBotDetection: optionalBooleanSchema.describe("Also track visits that look like bots (default: false)."),
  usePixel: optionalBooleanSchema.describe("Send events with a 1x1 image request instead of fetch (default: false)."),
  enableBatching: optionalBooleanSchema.describe("Send events in batches (default: true)."),
  batchSize: z.number().int().min(1).max(DATABUDDY_MAX_BATCH_SIZE).optional().describe("Events per batch, from 1 to 50 (default: 10)."),
  batchTimeout: databuddyDelaySchema.optional().describe("Milliseconds before a partial batch is sent (default: 5000)."),
  enableRetries: optionalBooleanSchema.describe("Retry failed requests (default: true)."),
  maxRetries: z.number().int().min(0).max(DATABUDDY_MAX_RETRIES).optional().describe("Retries per failed request (default: 3)."),
  initialRetryDelay: databuddyDelaySchema.optional().describe("Milliseconds before the first retry (default: 500).")
});
var siteIntegrationUpdateSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("databuddy"),
    settings: databuddySchema.nullable()
  }),
  z.object({ provider: z.literal("ga4"), settings: ga4Schema.nullable() }),
  z.object({
    provider: z.literal("umami"),
    settings: umamiSchema.nullable()
  }),
  z.object({
    provider: z.literal("plausible"),
    settings: plausibleSchema.nullable()
  }),
  z.object({
    provider: z.literal("posthog"),
    settings: posthogSchema.nullable()
  })
]);
var siteIntegrationsSchema = z.strictObject({
  databuddy: databuddySchema.optional(),
  ga4: ga4Schema.optional(),
  plausible: plausibleSchema.optional(),
  posthog: posthogSchema.optional(),
  umami: umamiSchema.optional(),
  c15t: c15tSchema.optional()
}).default({}).describe("Analytics providers and the c15t consent banner for the live site. Notra installs their scripts automatically. Preview deployments and local development do not send provider events.");
var siteSecuritySchema = z.strictObject({
  contentSecurityPolicy: z.boolean().default(true),
  allowedOrigins: z.array(z.string().trim().toLowerCase().regex(CSP_ORIGIN, "Use an origin like https://cdn.example.com (no path), optionally https://*.example.com")).max(SITE_CSP_MAX_ALLOWED_ORIGINS).default([]),
  webAssembly: z.boolean().default(false).describe("Let scripts compile WebAssembly, for runtimes like Rive or Lottie. Adds 'wasm-unsafe-eval' to script-src; JavaScript eval stays blocked.")
}).default({
  contentSecurityPolicy: true,
  allowedOrigins: [],
  webAssembly: false
});

// ../../packages/sites-core/src/constants/tags.ts
var COMBINING_MARKS = /\p{M}+/gu;
var NON_WORD_RUN = /[^\p{L}\p{N}]+/gu;
var EDGE_DASHES = /^-+|-+$/g;
var SITE_BLOG_CATEGORY_LIMIT = 12;

// ../../packages/sites-core/src/schemas/site-layout.ts
import { z as z2 } from "zod";
var sitePathSchema = z2.string().trim().min(1).max(300);
var href = z2.string().trim().regex(SITE_LINK_HREF, "Use an absolute https:// URL or a path");
var icon = z2.string().trim().regex(SITE_ICON_NAME, "Use a Lucide icon name like book-open");
var colorByMode = z2.union([
  z2.string().regex(SITE_HEX_COLOR),
  z2.object({
    light: z2.string().regex(SITE_HEX_COLOR),
    dark: z2.string().regex(SITE_HEX_COLOR)
  })
]);
var siteLinkSchema = z2.object({
  label: z2.string().trim().min(1).max(60),
  href,
  icon: icon.optional()
});
var platformHref = z2.url().regex(/^https?:\/\//, "Use an http:// or https:// URL");
var siteNavbarLinkSchema = z2.union([
  siteLinkSchema.strict(),
  z2.strictObject({
    type: z2.enum(SITE_NAVBAR_LINK_TYPES),
    href: platformHref,
    label: z2.string().trim().min(1).max(60).optional()
  })
]);
var siteNavbarAreaSchema = z2.strictObject({
  area: z2.enum(["blog", "changelog"]),
  label: z2.string().trim().min(1).max(60).regex(/\S/).optional()
});
var blogNavbarAreaSchema = siteNavbarAreaSchema.extend({
  area: z2.literal("blog")
});
var changelogNavbarAreaSchema = siteNavbarAreaSchema.extend({
  area: z2.literal("changelog")
});
var siteNavbarSchema = z2.object({
  areas: z2.union([
    z2.tuple([]),
    z2.tuple([siteNavbarAreaSchema]),
    z2.tuple([blogNavbarAreaSchema, changelogNavbarAreaSchema]),
    z2.tuple([changelogNavbarAreaSchema, blogNavbarAreaSchema])
  ]).optional(),
  links: z2.array(z2.union([
    siteNavbarLinkSchema,
    z2.strictObject({
      label: z2.string().trim().min(1).max(60),
      icon: icon.optional(),
      items: z2.array(siteNavbarLinkSchema).min(1).max(8)
    })
  ])).max(8).default([]),
  cta: siteLinkSchema.optional(),
  primary: z2.object({ type: z2.enum(SITE_NAVBAR_LINK_TYPES), href: platformHref }).optional()
}).default({ links: [] });
var footerColumnSchema = z2.object({
  header: z2.string().trim().min(1).max(60).optional(),
  items: z2.array(siteLinkSchema).min(1).max(12)
});
var siteFooterSchema = z2.object({
  links: z2.union([
    z2.array(siteLinkSchema).max(16),
    z2.array(footerColumnSchema).max(6)
  ]).default([]),
  socials: z2.partialRecord(z2.enum(SITE_SOCIAL_PLATFORMS), z2.url()).default({})
}).default({ links: [], socials: {} });
var siteBannerSchema = z2.object({
  content: z2.string().trim().min(1).max(300),
  dismissible: z2.boolean().default(false),
  type: z2.enum(["info", "warning", "critical"]).default("info"),
  color: colorByMode.optional()
});
var siteContextualSchema = z2.object({
  options: z2.array(z2.union([
    z2.enum(SITE_CONTEXTUAL_OPTIONS),
    z2.object({
      title: z2.string().trim().min(1).max(60),
      description: z2.string().trim().max(120).optional(),
      icon: icon.optional(),
      href: z2.string().trim().max(500).regex(/^(?:https?:\/\/|\/(?!\/)|mailto:)/, "Use an https:// URL or a path. Notra fills in {url} and {markdownUrl}.")
    })
  ])).max(12).default(["copy", "view", "chatgpt", "claude", "perplexity", "grok"]),
  display: z2.enum(["meta", "none"]).default("meta")
}).default({
  options: ["copy", "view", "chatgpt", "claude", "perplexity", "grok"],
  display: "meta"
});
var siteSeoSchema = z2.object({
  metatags: z2.record(z2.string().regex(/^[a-z][a-z0-9:_.-]*$/i), z2.string().max(500)).default({}),
  indexing: z2.enum(["navigable", "all"]).default("navigable"),
  image: sitePathSchema.optional(),
  imageAlt: z2.string().trim().max(200).optional(),
  organization: z2.object({
    name: z2.string().trim().min(1).max(120),
    legalName: z2.string().trim().max(160).optional(),
    url: z2.url().optional(),
    logo: sitePathSchema.optional(),
    sameAs: z2.array(z2.url()).max(12).default([])
  }).optional()
}).default({ metatags: {}, indexing: "navigable" });
var siteErrorsSchema = z2.object({
  404: z2.object({
    title: z2.string().trim().max(120).optional(),
    description: z2.string().trim().max(300).optional(),
    redirect: z2.boolean().default(false)
  }).default({ redirect: false })
}).default({ 404: { redirect: false } });
var siteThumbnailsSchema = z2.object({
  enabled: z2.boolean().default(true),
  appearance: z2.enum(["light", "dark"]).default("light"),
  background: sitePathSchema.optional(),
  font: z2.string().trim().max(80).optional(),
  layout: z2.enum(["default", "author", "article"]).default("default"),
  label: z2.string().trim().min(1).max(40).optional()
}).default({ enabled: true, appearance: "light", layout: "default" });
var siteMarkdownSchema = z2.object({
  instructions: z2.union([
    z2.string().trim().max(2000),
    z2.array(z2.string().trim().max(500)).max(20)
  ]).optional()
}).default({});
var siteVariablesSchema = z2.record(z2.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,39}$/), z2.string().max(500)).default({});
var siteLayoutSchema = z2.object({
  width: z2.union([z2.number().min(40).max(120), z2.literal("full")]).default(72)
}).default({ width: 72 });
var blogHeroSchema = z2.object({
  style: z2.enum(["wash", "plain", "image", "none"]).default("plain"),
  eyebrow: z2.string().trim().max(60).optional(),
  image: sitePathSchema.optional()
}).default({ style: "plain" });
var siteBlogSchema = z2.object({
  title: z2.string().trim().min(1).max(120).optional(),
  description: z2.string().trim().max(400).optional(),
  layout: z2.enum(["grid", "list", "magazine", "cards"]).default("grid"),
  hero: blogHeroSchema,
  featured: z2.union([
    z2.enum(["latest", "none"]),
    z2.array(z2.string().trim().min(1)).max(6)
  ]).default("none"),
  categories: z2.union([
    z2.boolean(),
    z2.array(z2.string().trim().min(1).max(40)).min(1).max(SITE_BLOG_CATEGORY_LIMIT)
  ]).default(false),
  search: z2.boolean().default(false),
  card: z2.object({
    image: z2.union([z2.boolean(), z2.literal("auto")]).default("auto"),
    excerpt: z2.boolean().default(true),
    author: z2.boolean().default(true),
    date: z2.boolean().default(true),
    readingTime: z2.boolean().default(false)
  }).default({
    image: "auto",
    excerpt: true,
    author: true,
    date: true,
    readingTime: false
  }),
  authorPage: z2.enum(["inline", "stacked"]).default("inline"),
  post: z2.object({
    toc: z2.boolean().default(true),
    authorCard: z2.boolean().default(true),
    readingTime: z2.boolean().default(true),
    pagination: z2.boolean().default(true),
    width: z2.enum(["narrow", "wide"]).default("wide"),
    header: z2.enum(["stacked", "compact"]).default("stacked"),
    cover: z2.boolean().default(true)
  }).default({
    toc: true,
    authorCard: true,
    readingTime: true,
    pagination: true,
    width: "wide",
    header: "stacked",
    cover: true
  })
});
var siteChangelogSchema = z2.object({
  title: z2.string().trim().min(1).max(120).optional(),
  description: z2.string().trim().max(400).optional(),
  layout: z2.enum(["timeline", "cards", "compact"]).default("timeline"),
  hero: blogHeroSchema,
  pageActions: z2.boolean().default(false)
});
var siteMetadataSchema = z2.object({
  timestamp: z2.boolean().default(true),
  dateFormat: z2.enum(["short", "long"]).default("short")
}).default({ timestamp: true, dateFormat: "short" });

// ../../packages/sites-core/src/schemas/site-config.ts
import { z as z3 } from "zod";
var redirectSchema = z3.object({
  source: z3.string().trim().startsWith("/"),
  destination: z3.string().trim().regex(SITE_LINK_HREF, "Use an absolute https:// URL or a path"),
  permanent: z3.boolean().default(true)
});
var siteAuthorSchema = z3.strictObject({
  name: z3.string().trim().min(1).max(80),
  title: z3.string().trim().max(80).optional(),
  avatar: z3.string().trim().regex(SITE_AUTHOR_AVATAR, "Use a path like /images/jan.jpg or an https:// URL").optional(),
  bio: z3.string().trim().max(300).optional(),
  url: z3.url().optional(),
  x: z3.url().optional(),
  linkedin: z3.url().optional(),
  github: z3.url().optional(),
  youtube: z3.url().optional()
});
var imageByModeSchema = z3.object({
  light: sitePathSchema,
  dark: sitePathSchema
});
var fontSpecSchema = z3.object({
  family: z3.string().trim().min(1).max(80),
  weight: z3.number().int().min(100).max(900).optional(),
  source: z3.string().trim().min(1).optional(),
  format: z3.enum(["woff", "woff2"]).optional()
});
var appearanceSchema = z3.union([
  z3.enum(["light", "dark", "system"]),
  z3.object({
    default: z3.enum(["light", "dark", "system"]).default("system"),
    strict: z3.boolean().default(false),
    storageKey: z3.string().trim().regex(SITE_APPEARANCE_STORAGE_KEY, "Use letters, digits, dashes, underscores or dots").default(SITE_DEFAULT_APPEARANCE_STORAGE_KEY)
  })
]).default("system").transform((value) => typeof value === "string" ? {
  default: value,
  strict: false,
  storageKey: SITE_DEFAULT_APPEARANCE_STORAGE_KEY
} : value);
var shikiThemeName = z3.string().trim().regex(/^[a-z0-9-]+$/);
var siteConfigSchema = z3.object({
  $schema: z3.string().optional(),
  theme: z3.enum(["notra"]).default("notra"),
  name: z3.string().trim().min(1).max(80),
  description: z3.string().trim().max(300).optional(),
  logo: z3.union([
    sitePathSchema,
    imageByModeSchema.extend({
      href: z3.string().trim().regex(SITE_LINK_HREF).optional()
    })
  ]).optional(),
  favicon: z3.union([sitePathSchema, imageByModeSchema]).optional(),
  colors: z3.object({
    primary: z3.string().regex(SITE_HEX_COLOR).default(SITE_DEFAULT_PRIMARY_COLOR),
    light: z3.string().regex(SITE_HEX_COLOR).optional(),
    dark: z3.string().regex(SITE_HEX_COLOR).optional()
  }).default({ primary: SITE_DEFAULT_PRIMARY_COLOR }),
  appearance: appearanceSchema,
  fonts: fontSpecSchema.partial({ family: true }).extend({
    heading: fontSpecSchema.optional(),
    body: fontSpecSchema.optional()
  }).optional(),
  background: z3.object({
    decoration: z3.enum(["none", "grid", "dots", "gradient"]).default("none"),
    image: z3.union([sitePathSchema, imageByModeSchema]).optional(),
    color: z3.object({
      light: z3.string().regex(SITE_HEX_COLOR).optional(),
      dark: z3.string().regex(SITE_HEX_COLOR).optional()
    }).optional()
  }).default({ decoration: "none" }),
  styling: z3.object({
    codeblocks: z3.union([
      z3.enum(["system", "dark"]),
      shikiThemeName,
      z3.object({ light: shikiThemeName, dark: shikiThemeName })
    ]).default("system"),
    smartQuotes: z3.boolean().default(true).describe("Turn straight quotes, apostrophes, dashes and ellipses into typographic ones. Set false to keep the characters exactly as written.")
  }).default({ codeblocks: "system", smartQuotes: true }),
  layout: siteLayoutSchema,
  banner: siteBannerSchema.optional(),
  navbar: siteNavbarSchema,
  footer: siteFooterSchema,
  authors: z3.record(z3.string().regex(SITE_AUTHOR_ID, "Use lowercase letters, digits and dashes for author ids"), siteAuthorSchema).default({}),
  blog: siteBlogSchema.optional(),
  changelog: siteChangelogSchema.optional(),
  contextual: siteContextualSchema,
  seo: siteSeoSchema,
  errors: siteErrorsSchema,
  thumbnails: siteThumbnailsSchema,
  metadata: siteMetadataSchema,
  markdown: siteMarkdownSchema,
  variables: siteVariablesSchema,
  redirects: z3.array(redirectSchema).max(500).default([]),
  integrations: siteIntegrationsSchema,
  security: siteSecuritySchema
});
var frontmatterLinkSchema = z3.url({
  protocol: /^https?$/,
  error: "Use a full http(s):// URL"
});
var frontmatterAuthorSchema = z3.object({
  id: z3.string().trim().regex(SITE_AUTHOR_ID, "Use lowercase letters, digits and dashes for author ids").optional(),
  name: z3.string().trim().min(1),
  title: z3.string().trim().optional(),
  bio: z3.string().trim().optional(),
  avatar: z3.string().trim().regex(SITE_AUTHOR_AVATAR, "Use a path like /images/jan.jpg or an https:// URL").optional(),
  url: frontmatterLinkSchema.optional(),
  x: frontmatterLinkSchema.optional(),
  linkedin: frontmatterLinkSchema.optional(),
  github: frontmatterLinkSchema.optional(),
  youtube: frontmatterLinkSchema.optional()
});
var frontmatterAuthorRefSchema = z3.union([
  z3.string(),
  frontmatterAuthorSchema
]);
var blogFrontmatterSchema = z3.object({
  title: z3.string().trim().min(1),
  description: z3.string().trim().optional(),
  date: z3.coerce.date(),
  updated: z3.coerce.date().optional(),
  author: z3.union([frontmatterAuthorRefSchema, z3.array(frontmatterAuthorRefSchema)]).optional(),
  image: z3.string().optional(),
  imageAlt: z3.string().trim().optional(),
  tags: z3.array(z3.string()).default([]),
  featured: z3.boolean().default(false),
  draft: z3.boolean().default(false),
  hidden: z3.boolean().default(false),
  noindex: z3.boolean().default(false)
});
var changelogFrontmatterSchema = z3.object({
  title: z3.string().trim().min(1),
  description: z3.string().trim().optional(),
  date: z3.coerce.date(),
  version: z3.string().trim().optional(),
  tags: z3.array(z3.string()).default([]),
  image: z3.string().optional(),
  imageAlt: z3.string().trim().optional(),
  draft: z3.boolean().default(false),
  hidden: z3.boolean().default(false)
});

// ../../packages/sites-core/src/utils/custom-scripts.ts
function isCustomScriptPath(path) {
  if (!/\.js$/i.test(path)) {
    return false;
  }
  const root = path.split("/")[0] ?? "";
  return path === SITE_CUSTOM_SCRIPT_FILENAME || root === SITE_CUSTOM_SCRIPTS_DIR || !SITE_SOURCE_ROOTS.has(root);
}
function sortCustomScriptPaths(paths) {
  return [...paths].filter(isCustomScriptPath).sort((a, b) => {
    if (a === SITE_CUSTOM_SCRIPT_FILENAME) {
      return -1;
    }
    if (b === SITE_CUSTOM_SCRIPT_FILENAME) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return a > b ? 1 : 0;
  });
}

// ../../packages/sites-core/src/utils/site-ignore.ts
import ignore from "ignore";
function createSiteIgnore(content = "") {
  const matcher = ignore({ ignorecase: false }).add(content);
  return (path) => path !== SITE_CONFIG_FILENAME && path !== SITE_IGNORE_FILENAME && matcher.ignores(path);
}
function filterSiteFiles(files) {
  const isIgnored = createSiteIgnore(files.get(SITE_IGNORE_FILENAME) ?? "");
  return new Map([...files].filter(([path]) => path !== SITE_IGNORE_FILENAME && !isIgnored(path)));
}

// ../../packages/sites-core/src/utils/tags.ts
function tagSlug(tag) {
  return tag.normalize("NFKD").replace(COMBINING_MARKS, "").toLowerCase().replace(NON_WORD_RUN, "-").replace(EDGE_DASHES, "");
}

// ../../packages/sites-compiler/src/validate.ts
import { Parser as Parser2 } from "acorn";

// ../../packages/sites-compiler/src/constants/validate.ts
var TEXT_SOURCE_FILE = /\.(?:mdx?|jsx?|json|txt|css|svg)$/i;
var ENTRY_FILE = /^(blog|changelog)\/(.+)\.(mdx?)$/;
var ENTRY_SLUG = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;
var MDX_FILE = /\.mdx$/i;
var SCRIPT_FILE = /\.jsx?$/i;

// ../../packages/sites-compiler/src/frontmatter.ts
import { parse as parseYaml } from "yaml";

// ../../packages/sites-compiler/src/constants/frontmatter.ts
var FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

// ../../packages/sites-compiler/src/constants/errors.ts
var ACORN_LOCATION_SUFFIX = /\s*\(\d+:\d+\)$/;

// ../../packages/sites-compiler/src/utils/errors.ts
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function errorSummary(error) {
  return errorMessage(error).split(`
`)[0] ?? "";
}
function acornSyntaxError(error) {
  return {
    message: errorMessage(error).replace(ACORN_LOCATION_SUFFIX, ""),
    offset: error.pos ?? 0
  };
}
function micromarkErrorPosition(error) {
  const place = error.place;
  const line = place?.line ?? place?.start?.line;
  const column = place?.column ?? place?.start?.column;
  return { ...line ? { line } : {}, ...column ? { column } : {} };
}

// ../../packages/sites-compiler/src/frontmatter.ts
function frontmatterError(path, code, message) {
  return { severity: "error", file: path, line: 1, code, message };
}
function parseEntryFrontmatter(path, area, source) {
  const yaml = FRONTMATTER_BLOCK.exec(source)?.[1];
  if (yaml === undefined) {
    return {
      data: null,
      diagnostics: [
        frontmatterError(path, "frontmatter_missing", "Missing frontmatter. Start the file with ---, a title and a date, then ---.")
      ]
    };
  }
  let raw;
  try {
    raw = parseYaml(yaml) ?? {};
  } catch (error) {
    return {
      data: null,
      diagnostics: [
        frontmatterError(path, "frontmatter_yaml", `Frontmatter is not valid YAML: ${errorSummary(error)}`)
      ]
    };
  }
  const schema = area === "blog" ? blogFrontmatterSchema : changelogFrontmatterSchema;
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { data: parsed.data, diagnostics: [] };
  }
  return {
    data: null,
    diagnostics: parsed.error.issues.map((issue) => frontmatterError(path, "frontmatter_invalid", `Frontmatter ${issue.path.join(".") || "value"}: ${issue.message}`))
  };
}

// ../../packages/sites-compiler/src/utils/estree.ts
import { EXIT, visit as visitEstree } from "estree-util-visit";

// ../../packages/sites-compiler/src/constants/builtins.ts
var BUILTIN_COMPONENTS = [
  "Note",
  "Tip",
  "Info",
  "Warning",
  "Check",
  "Danger",
  "Callout",
  "Card",
  "CardGroup",
  "Columns",
  "Tabs",
  "Tab",
  "Accordion",
  "AccordionGroup",
  "Steps",
  "Step",
  "CodeGroup",
  "Frame",
  "Badge",
  "Update",
  "Video",
  "YouTube",
  "ThemeToggle",
  "SiteAreas",
  "PrivacySettings"
];
var BUILTIN_COMPONENT_NAMES = new Set(BUILTIN_COMPONENTS);
var INJECTED_HOOK_NAMES = new Set(SITE_INJECTED_REACT_HOOKS);
var BUILTINS_IMPORT_SOURCE = "@notra/builtins";
var SITE_IMPORT_ALIAS = "@site";
var INLINE_MODULE_SUFFIX = ".notra-inline.jsx";
var IMPORTABLE_EXTENSIONS = [".mdx", ".md", ".jsx", ".js"];
var COMPONENT_NAME = /^[A-Z]/;
var KNOWN_GLOBALS = new Set([
  "props",
  "Math",
  "Date",
  "JSON",
  "Number",
  "String",
  "Boolean",
  "Array",
  "Object",
  "Intl",
  "undefined",
  "NaN",
  "Infinity",
  "console",
  "window",
  "document",
  "navigator",
  "frontmatter"
]);
var NODE_ONLY_GLOBALS = new Set([
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "Bun",
  "Deno",
  "Buffer"
]);

// ../../packages/sites-compiler/src/utils/estree.ts
function nodeRange(node) {
  const ranged = node;
  return { start: ranged.start ?? 0, end: ranged.end ?? 0 };
}
function patternNames(pattern) {
  if (!pattern) {
    return [];
  }
  switch (pattern.type) {
    case "Identifier":
      return [pattern.name];
    case "ObjectPattern":
      return pattern.properties.flatMap((property) => property.type === "RestElement" ? patternNames(property.argument) : patternNames(property.value));
    case "ArrayPattern":
      return pattern.elements.flatMap((element) => patternNames(element));
    case "RestElement":
      return patternNames(pattern.argument);
    case "AssignmentPattern":
      return patternNames(pattern.left);
    default:
      return [];
  }
}
function exportedDeclarationNames(statement) {
  if (statement.type !== "ExportNamedDeclaration" || !statement.declaration) {
    return [];
  }
  const { declaration } = statement;
  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations.flatMap((declarator) => declarator.id.type === "Identifier" ? [declarator.id.name] : []);
  }
  if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") {
    return declaration.id ? [declaration.id.name] : [];
  }
  return [];
}
function declaredNames(root) {
  const names = new Set;
  visitEstree(root, (node) => {
    const current = node;
    switch (current.type) {
      case "VariableDeclarator":
        for (const name of patternNames(current.id)) {
          names.add(name);
        }
        break;
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        if ("id" in current && current.id) {
          names.add(current.id.name);
        }
        for (const param of current.params) {
          for (const name of patternNames(param)) {
            names.add(name);
          }
        }
        break;
      case "ClassDeclaration":
        if (current.id) {
          names.add(current.id.name);
        }
        break;
      case "CatchClause":
        for (const name of patternNames(current.param)) {
          names.add(name);
        }
        break;
      default:
        break;
    }
  });
  return names;
}
function referencedIdentifiers(root) {
  const references = [];
  visitEstree(root, (node, key, _index, ancestors) => {
    const current = node;
    const parent = ancestors.at(-1);
    if (current.type === "Identifier") {
      if (parent?.type === "MemberExpression" && key === "property" && !parent.computed) {
        return;
      }
      if (parent?.type === "Property" && key === "key" && !parent.computed) {
        return;
      }
      references.push({
        name: current.name,
        start: current.start ?? -1,
        end: current.end ?? -1,
        shorthand: parent?.type === "Property" && parent.shorthand && key === "value"
      });
      return;
    }
    const jsx = node;
    if (jsx.type === "JSXIdentifier" && key === "name" && jsx.name && COMPONENT_NAME.test(jsx.name)) {
      references.push({
        name: jsx.name,
        start: jsx.start ?? -1,
        end: jsx.end ?? -1
      });
    }
  });
  return references;
}
function containsJsxOrFunction(root) {
  let found = false;
  visitEstree(root, (node) => {
    const { type } = node;
    if (type === "JSXElement" || type === "JSXFragment" || type === "ArrowFunctionExpression" || type === "FunctionExpression" || type === "FunctionDeclaration") {
      found = true;
      return EXIT;
    }
    return;
  });
  return found;
}
function findForbiddenSyntax(root) {
  const found = [];
  visitEstree(root, (node) => {
    const current = node;
    const { start } = nodeRange(current);
    if (current.type === "ImportExpression") {
      found.push({ message: "Dynamic import() is not supported", start });
    }
    if (current.type === "CallExpression" && current.callee.type === "Identifier" && (current.callee.name === "require" || current.callee.name === "eval")) {
      found.push({
        message: `${current.callee.name}() is not supported`,
        start
      });
    }
    if (current.type === "NewExpression" && current.callee.type === "Identifier" && current.callee.name === "Function") {
      found.push({ message: "new Function() is not supported", start });
    }
    if (current.type === "MetaProperty") {
      found.push({
        message: "import.meta is not available in site code",
        start
      });
    }
  });
  return found;
}
function findNodeApiUsage(root, declared) {
  return referencedIdentifiers(root).filter((reference) => NODE_ONLY_GLOBALS.has(reference.name) && !declared.has(reference.name)).map((reference) => ({
    message: `${reference.name} is a Node.js API and is not available in site components`,
    start: reference.start
  }));
}
function forbiddenUsage(root, declared = new Set) {
  return [...findForbiddenSyntax(root), ...findNodeApiUsage(root, declared)];
}
function jsxElementName(name) {
  if (name.type === "JSXIdentifier") {
    return name.name;
  }
  if (name.type === "JSXMemberExpression") {
    return `${jsxElementName(name.object)}.${name.property.name}`;
  }
  return `${name.namespace.name}:${name.name.name}`;
}
function jsxClientDirectives(root) {
  const elements = [];
  visitEstree(root, (node) => {
    if (node.type !== "JSXOpeningElement") {
      return;
    }
    const directives = node.attributes.flatMap((attribute) => {
      if (attribute.type !== "JSXAttribute" || attribute.name.type !== "JSXNamespacedName" || attribute.name.namespace.name !== "client") {
        return [];
      }
      return [
        {
          ...nodeRange(attribute),
          name: `client:${attribute.name.name.name}`,
          hasValue: attribute.value !== null
        }
      ];
    });
    if (directives.length > 0) {
      elements.push({
        name: jsxElementName(node.name),
        start: nodeRange(node).start,
        directives
      });
    }
  });
  return elements;
}

// ../../packages/sites-compiler/src/utils/jsx.ts
import { Parser } from "acorn";
import jsx from "acorn-jsx";
var JsxParser = Parser.extend(jsx());
function parseJsxModule(source) {
  return JsxParser.parse(source, {
    ecmaVersion: "latest",
    sourceType: "module"
  });
}
function missingHookImports(program, ownNames) {
  const missing = new Set;
  for (const reference of referencedIdentifiers(program)) {
    if (INJECTED_HOOK_NAMES.has(reference.name) && !ownNames.has(reference.name)) {
      missing.add(reference.name);
    }
  }
  return [...missing].sort();
}

// ../../packages/sites-compiler/src/utils/paths.ts
import { posix } from "node:path";
function resolveSiteImport(fromPath, source, files) {
  if (!(source.startsWith("/") || source.startsWith("./") || source.startsWith("../"))) {
    return {
      ok: false,
      message: `Cannot import "${source}": only files from this repository can be imported (start the path with / or ./). npm packages are not supported.`
    };
  }
  const joined = source.startsWith("/") ? posix.normalize(source.slice(1)) : posix.normalize(posix.join(posix.dirname(fromPath), source));
  if (joined.startsWith("..") || posix.isAbsolute(joined)) {
    return {
      ok: false,
      message: `Cannot import "${source}": the path leaves the site root`
    };
  }
  const extension = posix.extname(joined).toLowerCase();
  const candidates = IMPORTABLE_EXTENSIONS.includes(extension) ? [joined] : IMPORTABLE_EXTENSIONS.map((ext) => `${joined}${ext}`);
  for (const candidate of candidates) {
    if (files.has(candidate)) {
      const candidateExtension = posix.extname(candidate).toLowerCase();
      return {
        ok: true,
        path: candidate,
        kind: candidateExtension === ".jsx" || candidateExtension === ".js" ? "component" : "content"
      };
    }
  }
  if (extension === ".json") {
    return {
      ok: false,
      message: `Cannot import "${source}": JSON imports are not supported`
    };
  }
  return { ok: false, message: `Cannot import "${source}": file not found` };
}
var cachedSource;
var cachedLineBreaks = [];
function lineBreaks(source) {
  if (source !== cachedSource) {
    const breaks = [];
    for (let index = 0;index < source.length; index += 1) {
      if (source.charCodeAt(index) === 10) {
        breaks.push(index);
      }
    }
    cachedSource = source;
    cachedLineBreaks = breaks;
  }
  return cachedLineBreaks;
}
function offsetToLineColumn(source, offset) {
  const breaks = lineBreaks(source);
  const end = Math.min(offset, source.length);
  let low = 0;
  let high = breaks.length;
  while (low < high) {
    const middle = low + high >>> 1;
    if ((breaks[middle] ?? end) < end) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  const lastBreak = low > 0 ? breaks[low - 1] ?? -1 : -1;
  return { line: low + 1, column: offset - lastBreak };
}
function isTextSourceFile(path) {
  return TEXT_SOURCE_FILE.test(path);
}

// ../../packages/sites-compiler/src/jsx.ts
function analyzeJsxSnippet(path, source) {
  const diagnostics = [];
  const error = (code, message, offset) => {
    diagnostics.push({
      severity: "error",
      code,
      message,
      file: path,
      ...offsetToLineColumn(source, offset)
    });
  };
  let program;
  try {
    program = parseJsxModule(source);
  } catch (parseError) {
    const syntax = acornSyntaxError(parseError);
    error("jsx_syntax", `Syntax error: ${syntax.message}`, syntax.offset);
    return { diagnostics, exportedNames: [], output: null };
  }
  const ownNames = new Set;
  const exportedNames = [];
  for (const statement of program.body) {
    const { start } = nodeRange(statement);
    switch (statement.type) {
      case "ImportDeclaration":
        if (statement.source.value !== "react") {
          error("snippet_import", `Snippets cannot import "${String(statement.source.value)}". Import every snippet directly in the MDX page instead; npm packages are not supported.`, start);
        }
        for (const specifier of statement.specifiers) {
          ownNames.add(specifier.local.name);
        }
        break;
      case "ExportDefaultDeclaration":
        error("default_export", "Default exports are not supported. Use a named export: export const MyComponent = () => …", start);
        break;
      case "ExportAllDeclaration":
        error("export_all", "export * is not supported in snippets", start);
        break;
      case "ExportNamedDeclaration":
        if (statement.source) {
          error("reexport", "Re-exporting from another file is not supported", start);
        }
        for (const name of exportedDeclarationNames(statement)) {
          exportedNames.push(name);
          ownNames.add(name);
        }
        for (const specifier of statement.specifiers) {
          const { exported } = specifier;
          exportedNames.push(exported.type === "Identifier" ? exported.name : String(exported.value));
        }
        break;
      case "VariableDeclaration":
        for (const declarator of statement.declarations) {
          if (declarator.id.type === "Identifier") {
            ownNames.add(declarator.id.name);
          }
        }
        break;
      case "FunctionDeclaration":
      case "ClassDeclaration":
        ownNames.add(statement.id.name);
        break;
      default:
        break;
    }
  }
  for (const forbidden of forbiddenUsage(program, declaredNames(program))) {
    error("forbidden_syntax", forbidden.message, forbidden.start);
  }
  if (exportedNames.length === 0) {
    diagnostics.push({
      severity: "warning",
      code: "no_exports",
      message: "This snippet exports nothing, so it cannot be used from MDX",
      file: path
    });
  }
  if (hasErrors(diagnostics)) {
    return { diagnostics, exportedNames, output: null };
  }
  const hooks = missingHookImports(program, ownNames);
  const header = hooks.length > 0 ? `import { ${hooks.join(", ")} } from "react";
` : "";
  return { diagnostics, exportedNames, output: `${header}${source}` };
}

// ../../packages/sites-compiler/src/mdx.ts
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { visit } from "unist-util-visit";

// ../../packages/sites-compiler/src/constants/elements.ts
var BLOCKED_HTML_ELEMENTS = new Set(["script"]);
var BLOCKED_ELEMENT_HINT = "is not allowed in content. Put JavaScript in script.js or scripts/*.js.";
var HTML_OPENING_TAG = /<\s*([a-z][a-z0-9-]*)/gi;

// ../../packages/sites-compiler/src/utils/client-directives.ts
function analyzeStaticDirectives(elements, components) {
  const result = { edits: [], invalid: [] };
  for (const element of elements) {
    const directive = element.directives.find((attribute) => attribute.name === "client:static");
    if (!directive) {
      continue;
    }
    const root = element.name.split(".")[0] ?? "";
    if (!COMPONENT_NAME.test(root) || !components.has(root) || directive.hasValue || element.directives.length !== 1) {
      result.invalid.push(element.start);
      continue;
    }
    result.edits.push({ start: directive.start, end: directive.end, text: "" });
  }
  return result;
}

// ../../packages/sites-compiler/src/utils/mdast.ts
function isMdxJsxElement(node) {
  return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
}
function clientDirectives(element) {
  const start = element.position?.start.offset ?? 0;
  return element.attributes.filter((attribute) => attribute.type === "mdxJsxAttribute" && attribute.name.startsWith("client:")).map((attribute) => ({
    name: attribute.name,
    hasValue: attribute.value !== null,
    start: attribute.position?.start.offset ?? start,
    end: attribute.position?.end.offset ?? start
  }));
}
function expressionPrograms(node) {
  if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
    return node.data?.estree ? [node.data.estree] : [];
  }
  if (!isMdxJsxElement(node)) {
    return [];
  }
  return node.attributes.flatMap((attribute) => {
    if (attribute.type === "mdxJsxExpressionAttribute") {
      return attribute.data?.estree ? [attribute.data.estree] : [];
    }
    const { value } = attribute;
    return typeof value === "object" && value?.data?.estree ? [value.data.estree] : [];
  });
}

// ../../packages/sites-compiler/src/utils/text-edits.ts
function blankFrontmatter(source) {
  const match = FRONTMATTER_BLOCK.exec(source);
  if (!match) {
    return { text: source, length: 0 };
  }
  const blanked = match[0].replace(/[^\n]/g, " ");
  return {
    text: blanked + source.slice(match[0].length),
    length: match[0].length
  };
}
function applyEdits(source, edits) {
  let output = source;
  for (const edit of [...edits].sort((a, b) => b.start - a.start || b.end - a.end)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

// ../../packages/sites-compiler/src/mdx.ts
function report(pass, code, message, offset) {
  pass.diagnostics.push({
    severity: "error",
    code,
    message,
    file: pass.path,
    ...offsetToLineColumn(pass.source, offset)
  });
}
function checkForbidden(pass, program, declared) {
  for (const forbidden of forbiddenUsage(program, declared)) {
    report(pass, "forbidden_syntax", forbidden.message, forbidden.start);
  }
}
function parseMdx(pass) {
  try {
    return fromMarkdown(pass.text, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()]
    });
  } catch (parseError) {
    pass.diagnostics.push({
      severity: "error",
      code: "mdx_syntax",
      file: pass.path,
      ...micromarkErrorPosition(parseError),
      message: `MDX syntax error: ${errorSummary(parseError)}`
    });
    return null;
  }
}
function scanImport(pass, statement, scan) {
  const { start } = nodeRange(statement);
  const sourceValue = String(statement.source.value);
  const resolved = resolveSiteImport(pass.path, sourceValue, pass.context.files);
  if (!resolved.ok) {
    report(pass, "import", resolved.message, start);
    return;
  }
  scan.imports.push(resolved.path);
  pass.edits.push({
    ...nodeRange(statement.source),
    text: JSON.stringify(`${SITE_IMPORT_ALIAS}/${resolved.path}`)
  });
  for (const specifier of statement.specifiers) {
    scan.importedNames.add(specifier.local.name);
    if (resolved.kind === "content") {
      if (specifier.type === "ImportDefaultSpecifier") {
        scan.contentComponents.add(specifier.local.name);
      }
      continue;
    }
    if (specifier.type !== "ImportSpecifier") {
      report(pass, "component_import", `Import components by name: import { ${specifier.local.name} } from "${sourceValue}"`, start);
      continue;
    }
    const importedName = specifier.imported.type === "Identifier" ? specifier.imported.name : String(specifier.imported.value);
    if (!(pass.context.componentExports.get(resolved.path) ?? []).includes(importedName)) {
      report(pass, "missing_export", `"${resolved.path}" has no export named ${importedName}`, start);
    }
    scan.hydrated.add(specifier.local.name);
  }
}
function scanExport(pass, statement, scan) {
  const range = nodeRange(statement);
  if (statement.type === "ExportDefaultDeclaration") {
    report(pass, "default_export", "Default exports are not supported in MDX. Use a named export instead.", range.start);
    return;
  }
  if (statement.type === "ExportAllDeclaration") {
    report(pass, "export_all", "export * is not supported", range.start);
    return;
  }
  if (statement.type !== "ExportNamedDeclaration") {
    return;
  }
  if (statement.source || !statement.declaration) {
    report(pass, "reexport", "Only export const/function declarations are supported", range.start);
    return;
  }
  const names = exportedDeclarationNames(statement);
  for (const name of names) {
    scan.exportedNames.add(name);
  }
  const source = pass.text.slice(range.start, range.end);
  if (containsJsxOrFunction(statement)) {
    scan.inline.push({ names, source, node: statement, start: range.start });
    pass.edits.push({ ...range, text: "" });
  } else {
    scan.valueExports.push(source);
  }
}
function scanModule(pass, tree) {
  const scan = {
    imports: [],
    importedNames: new Set,
    exportedNames: new Set,
    hydrated: new Set,
    contentComponents: new Set,
    inline: [],
    valueExports: []
  };
  for (const node of tree.children.filter((child) => child.type === "mdxjsEsm")) {
    const program = node.data?.estree;
    if (!program) {
      continue;
    }
    checkForbidden(pass, program, declaredNames(program));
    for (const statement of program.body) {
      if (statement.type === "ImportDeclaration") {
        scanImport(pass, statement, scan);
      } else {
        scanExport(pass, statement, scan);
      }
    }
  }
  for (const inline of scan.inline) {
    for (const name of inline.names.filter((candidate) => COMPONENT_NAME.test(candidate))) {
      scan.hydrated.add(name);
    }
  }
  return scan;
}
function checkInlineComponents(pass, scan) {
  for (const inline of scan.inline) {
    const used = new Set(referencedIdentifiers(inline.node).map((reference) => reference.name));
    for (const name of scan.importedNames) {
      if (used.has(name)) {
        report(pass, "inline_uses_import", `An inline component uses "${name}", which is imported in this file. Move the component into a snippet (.jsx) and import what it needs there.`, inline.start);
      }
    }
  }
}
function snippetPropEdits(program, localNames) {
  const declared = declaredNames(program);
  return referencedIdentifiers(program).filter((reference) => reference.start >= 0 && !localNames.has(reference.name) && !declared.has(reference.name) && !KNOWN_GLOBALS.has(reference.name) && !BUILTIN_COMPONENT_NAMES.has(reference.name) && !INJECTED_HOOK_NAMES.has(reference.name) && !COMPONENT_NAME.test(reference.name) && !(reference.name in globalThis)).map((reference) => ({
    start: reference.start,
    end: reference.start,
    text: reference.shorthand ? `${reference.name}: props.` : "props."
  }));
}
function walkContent(pass, tree, scan) {
  const localNames = new Set([...scan.importedNames, ...scan.exportedNames]);
  const usedBuiltins = new Set;
  const propEdits = new Map;
  visit(tree, (node) => {
    const programs = expressionPrograms(node);
    const elements = programs.flatMap(jsxClientDirectives);
    const directives = isMdxJsxElement(node) ? clientDirectives(node) : [];
    if (isMdxJsxElement(node) && node.name) {
      elements.push({
        name: node.name,
        start: node.position?.start.offset ?? 0,
        directives
      });
    }
    const { edits, invalid } = analyzeStaticDirectives(elements, scan.hydrated);
    for (const start of invalid) {
      report(pass, "static_component", "Use client:static without a value on an imported JSX or inline component, and do not combine it with another client directive.", start);
    }
    if (invalid.length > 0) {
      return;
    }
    pass.edits.push(...edits);
    for (const program of programs) {
      checkForbidden(pass, program);
      if (!pass.context.isEntry) {
        for (const edit of snippetPropEdits(program, localNames)) {
          propEdits.set(edit.start, edit);
        }
      }
    }
    if (!(isMdxJsxElement(node) && node.name)) {
      return;
    }
    const { name } = node;
    const root = name.split(".")[0] ?? "";
    const start = node.position?.start.offset ?? 0;
    if (BLOCKED_HTML_ELEMENTS.has(name.toLowerCase())) {
      report(pass, "blocked_element", `<${name}> ${BLOCKED_ELEMENT_HINT}`, start);
      return;
    }
    if (!COMPONENT_NAME.test(root)) {
      return;
    }
    if (scan.hydrated.has(root)) {
      if (directives.length === 0) {
        const at = start + 1 + name.length;
        pass.edits.push({ start: at, end: at, text: " client:load" });
      }
    } else if (BUILTIN_COMPONENT_NAMES.has(root) && !localNames.has(root)) {
      usedBuiltins.add(root);
    } else if (!(localNames.has(root) || scan.contentComponents.has(root))) {
      report(pass, "unknown_component", `Unknown component <${name}>. Import it from a snippet or use a built-in component.`, start);
    }
  });
  const removed = pass.edits.filter((edit) => edit.text === "" && edit.end > edit.start);
  pass.edits.push(...[...propEdits.values()].filter((edit) => !removed.some((range) => range.start <= edit.start && edit.start < range.end)));
  return usedBuiltins;
}
function buildInlineModule(pass, scan) {
  const first = scan.inline[0];
  if (!first) {
    return null;
  }
  const modulePath = `${pass.path}${INLINE_MODULE_SUFFIX}`;
  const body = [
    ...scan.valueExports,
    ...scan.inline.map((inline) => inline.source)
  ].join(`

`);
  let hooks;
  try {
    hooks = missingHookImports(parseJsxModule(body), scan.exportedNames);
  } catch (parseError) {
    pass.diagnostics.push({
      severity: "error",
      code: "inline_component",
      file: pass.path,
      message: `Inline component could not be compiled: ${errorMessage(parseError)}`
    });
    return null;
  }
  const names = scan.inline.flatMap((inline) => inline.names).join(", ");
  pass.edits.push({
    start: first.start,
    end: first.start,
    text: `import { ${names} } from ${JSON.stringify(`${SITE_IMPORT_ALIAS}/${modulePath}`)};
export { ${names} };`
  });
  return {
    path: modulePath,
    source: hooks.length > 0 ? `import { ${hooks.join(", ")} } from "react";

${body}` : body
  };
}
function analyzeMdxFile(path, source, context) {
  const { text, length: frontmatterLength } = blankFrontmatter(source);
  const pass = {
    path,
    source,
    text,
    context,
    diagnostics: [],
    edits: []
  };
  const failed = (imports) => ({
    diagnostics: pass.diagnostics,
    output: null,
    inlineModule: null,
    imports
  });
  const tree = parseMdx(pass);
  if (!tree) {
    return failed([]);
  }
  const scan = scanModule(pass, tree);
  checkInlineComponents(pass, scan);
  const usedBuiltins = walkContent(pass, tree, scan);
  if (hasErrors(pass.diagnostics)) {
    return failed(scan.imports);
  }
  const inlineModule = buildInlineModule(pass, scan);
  if (hasErrors(pass.diagnostics)) {
    return failed(scan.imports);
  }
  if (usedBuiltins.size > 0) {
    pass.edits.push({
      start: frontmatterLength,
      end: frontmatterLength,
      text: `${[...usedBuiltins].sort().map((name) => `import ${name} from ${JSON.stringify(`${BUILTINS_IMPORT_SOURCE}/${name}.astro`)};`).join(`
`)}

`
    });
  }
  const edited = applyEdits(text, pass.edits);
  return {
    diagnostics: pass.diagnostics,
    output: source.slice(0, frontmatterLength) + edited.slice(frontmatterLength),
    inlineModule,
    imports: scan.imports
  };
}

// ../../packages/sites-compiler/src/utils/config-checks.ts
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1;i <= a.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1;j <= b.length; j += 1) {
      const current = row[j] ?? 0;
      row[j] = Math.min(current + 1, (row[j - 1] ?? 0) + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length] ?? 0;
}
function unknownConfigKeyWarnings(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }
  const known = Object.keys(siteConfigSchema.shape);
  return Object.keys(raw).filter((key) => !known.includes(key)).map((key) => {
    const suggestion = known.map((candidate) => ({
      candidate,
      score: distance(key.toLowerCase(), candidate.toLowerCase())
    })).sort((a, b) => a.score - b.score)[0];
    const hint = suggestion && suggestion.score <= 2 ? ` Did you mean "${suggestion.candidate}"?` : "";
    return {
      severity: "warning",
      file: SITE_CONFIG_FILENAME,
      code: "config_unknown_key",
      message: `Unknown setting "${key}" is ignored.${hint}`
    };
  });
}
function featuredSlugWarnings(config, entries) {
  const featured = config.blog?.featured;
  if (!Array.isArray(featured)) {
    return [];
  }
  const slugs = new Set(entries.filter((entry) => entry.area === "blog").map((entry) => entry.slug));
  return featured.filter((slug) => !slugs.has(slug)).map((slug) => ({
    severity: "warning",
    file: SITE_CONFIG_FILENAME,
    code: "featured_unknown",
    message: `blog.featured: no post at blog/${slug}. It is skipped.`
  }));
}
function categoryWarnings(config, blogTags) {
  const categories = config.blog?.categories;
  if (!Array.isArray(categories)) {
    return [];
  }
  return categories.filter((name) => !blogTags.has(tagSlug(name))).map((name) => ({
    severity: "warning",
    file: SITE_CONFIG_FILENAME,
    code: "category_unknown",
    message: `blog.categories: no post is tagged "${name}". It is skipped.`
  }));
}

// ../../packages/sites-compiler/src/utils/import-cycles.ts
function importCycleDiagnostics(paths, importsOf) {
  const diagnostics = [];
  const visiting = new Set;
  const done = new Set;
  const reportedCycles = new Set;
  const trail = [];
  const stack = [];
  for (const path of paths) {
    if (done.has(path)) {
      continue;
    }
    visiting.add(path);
    trail.push(path);
    stack.push({ path, imports: importsOf(path), index: 0 });
    while (stack.length > 0) {
      const frame = stack.at(-1);
      if (!frame) {
        break;
      }
      const next = frame.imports[frame.index++];
      if (next === undefined) {
        stack.pop();
        trail.pop();
        visiting.delete(frame.path);
        done.add(frame.path);
        continue;
      }
      if (done.has(next)) {
        continue;
      }
      if (visiting.has(next)) {
        const cycle = [...trail.slice(trail.indexOf(next)), next].join(" → ");
        if (!reportedCycles.has(cycle)) {
          reportedCycles.add(cycle);
          diagnostics.push({
            severity: "error",
            file: next,
            code: "import_cycle",
            message: `Import cycle: ${cycle}`
          });
        }
        continue;
      }
      visiting.add(next);
      trail.push(next);
      stack.push({ path: next, imports: importsOf(next), index: 0 });
    }
  }
  return diagnostics;
}

// ../../packages/sites-compiler/src/utils/markdown-html.ts
import { fromMarkdown as fromMarkdown2 } from "mdast-util-from-markdown";
import { visit as visit2 } from "unist-util-visit";
function blockedMarkdownHtml(path, source) {
  const diagnostics = [];
  const tree = fromMarkdown2(source);
  visit2(tree, "html", (node) => {
    for (const match of node.value.matchAll(HTML_OPENING_TAG)) {
      const tag = match[1]?.toLowerCase() ?? "";
      if (BLOCKED_HTML_ELEMENTS.has(tag)) {
        diagnostics.push({
          severity: "error",
          code: "blocked_element",
          file: path,
          message: `<${tag}> ${BLOCKED_ELEMENT_HINT}`,
          ...offsetToLineColumn(source, (node.position?.start.offset ?? 0) + (match.index ?? 0))
        });
      }
    }
  });
  return diagnostics;
}

// ../../packages/sites-compiler/src/constants/variables.ts
var VARIABLE_OR_CODE_SPAN = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)|(?<!\\)(?<!=\s*)\{\{\s*([A-Za-z][A-Za-z0-9_-]*)\s*\}\}/g;
var CODE_FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
var CODE_FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
var VARIABLE_REFERENCE = /\{\{\s*([A-Za-z][A-Za-z0-9_-]*)\s*\}\}/g;
var YAML_SAFE_VALUE = /^[^"'\n#:{}[\]&*!|>%@`\\]*$/;

// ../../packages/sites-compiler/src/utils/mdx-variable-ranges.ts
import { fromMarkdown as fromMarkdown3 } from "mdast-util-from-markdown";
import { mdxFromMarkdown as mdxFromMarkdown2 } from "mdast-util-mdx";
import { mdxjs as mdxjs2 } from "micromark-extension-mdxjs";
import { visit as visit3 } from "unist-util-visit";
function mdxVariableCodeRanges(source) {
  const masked = source.replace(VARIABLE_OR_CODE_SPAN, (match, codeSpan, name) => codeSpan !== undefined || name === undefined ? match : match.replace(/[^\r\n]/g, "x"));
  try {
    const tree = fromMarkdown3(masked, {
      extensions: [mdxjs2()],
      mdastExtensions: [mdxFromMarkdown2()]
    });
    const ranges = [];
    visit3(tree, (node) => {
      if (node.type === "mdxjsEsm") {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        if (start !== undefined && end !== undefined) {
          ranges.push({ start, end });
        }
      }
      ranges.push(...expressionPrograms(node).map(nodeRange));
    });
    return ranges;
  } catch {
    return [{ start: 0, end: source.length }];
  }
}

// ../../packages/sites-compiler/src/utils/variables.ts
function lookup(variables, name) {
  return Object.hasOwn(variables, name) ? variables[name] : undefined;
}
function mergeRanges(ranges) {
  const merged = [];
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ start: range.start, end: range.end });
    }
  }
  return merged;
}
function inRanges(ranges, offset) {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = low + high >>> 1;
    const range = ranges[middle];
    if (!range) {
      return false;
    }
    if (offset < range.start) {
      high = middle - 1;
    } else if (offset >= range.end) {
      low = middle + 1;
    } else {
      return true;
    }
  }
  return false;
}
function splitFencedCode(source, start) {
  const segments = [];
  let segmentStart = start;
  let fence = null;
  let lineStart = start;
  while (lineStart < source.length) {
    const newline = source.indexOf(`
`, lineStart);
    const lineEnd = newline === -1 ? source.length : newline + 1;
    const line = source.slice(lineStart, lineEnd).replace(/\r?\n$/, "");
    if (fence === null) {
      const open = CODE_FENCE_OPEN.exec(line)?.[1];
      if (open) {
        segments.push({ start: segmentStart, end: lineStart, code: false });
        segmentStart = lineStart;
        fence = open;
      }
    } else {
      const close = CODE_FENCE_CLOSE.exec(line)?.[1];
      if (close && close[0] === fence[0] && close.length >= fence.length) {
        segments.push({ start: segmentStart, end: lineEnd, code: true });
        segmentStart = lineEnd;
        fence = null;
      }
    }
    lineStart = lineEnd;
  }
  segments.push({
    start: segmentStart,
    end: source.length,
    code: fence !== null
  });
  return segments.filter((segment) => segment.end > segment.start);
}
function substituteVariables(source, variables, isMdx = true) {
  const unknown = [];
  const bodyStart = FRONTMATTER_BLOCK.exec(source)?.[0].length ?? 0;
  const frontmatter = substituteFrontmatter(source.slice(0, bodyStart), variables);
  unknown.push(...frontmatter.unknown);
  const codeRanges = isMdx ? mergeRanges(mdxVariableCodeRanges(source.slice(bodyStart))) : [];
  const parts = [frontmatter.text];
  for (const segment of splitFencedCode(source, bodyStart)) {
    const text = source.slice(segment.start, segment.end);
    if (segment.code || !text.includes("{{")) {
      parts.push(text);
      continue;
    }
    parts.push(text.replace(VARIABLE_OR_CODE_SPAN, (match, codeSpan, name, offset) => {
      if (codeSpan !== undefined || name === undefined) {
        return match;
      }
      const bodyOffset = segment.start + offset - bodyStart;
      if (inRanges(codeRanges, bodyOffset)) {
        return match;
      }
      const value = lookup(variables, name);
      if (value !== undefined) {
        return value;
      }
      unknown.push({ name, offset: segment.start + offset });
      return match.replaceAll("{", "\\{").replaceAll("}", "\\}");
    }));
  }
  return { text: parts.join(""), unknown };
}
function substituteFrontmatter(block, variables) {
  const unknown = [];
  const text = block.replace(VARIABLE_REFERENCE, (match, name, offset) => {
    const value = lookup(variables, name);
    if (value !== undefined && YAML_SAFE_VALUE.test(value)) {
      return value;
    }
    unknown.push({ name, offset });
    return match;
  });
  return { text, unknown };
}
function substituteSettingText(text, variables) {
  const unknown = [];
  const result = text.replace(VARIABLE_REFERENCE, (match, name) => {
    const value = lookup(variables, name);
    if (value === undefined) {
      unknown.push(name);
      return match;
    }
    return value;
  });
  return { text: result, unknown };
}

// ../../packages/sites-compiler/src/validate.ts
function entryCandidate(path) {
  const match = ENTRY_FILE.exec(path);
  if (!match) {
    return null;
  }
  const [, area, rest, format] = match;
  if (!(area && rest && format)) {
    return null;
  }
  if (rest.split("/").some((segment) => segment.startsWith("_"))) {
    return null;
  }
  const slug = rest.endsWith("/index") ? rest.slice(0, -"/index".length) : rest;
  return {
    area,
    slug,
    format
  };
}
function takesVariables(path) {
  return entryCandidate(path) !== null || SITE_CHROME_FILES.includes(path) || path.startsWith("snippets/") && MDX_FILE.test(path) || path.startsWith(`${SITE_SLOTS_DIR}/`) && MDX_FILE.test(path);
}
function validateSlotFile(path) {
  if (!path.startsWith(`${SITE_SLOTS_DIR}/`)) {
    return [];
  }
  const name = path.slice(SITE_SLOTS_DIR.length + 1);
  const slotName = name.replace(/\.mdx$/, "");
  if (name.endsWith(".mdx") && SITE_SLOT_NAMES.includes(slotName)) {
    return [];
  }
  return [
    {
      severity: "error",
      file: path,
      code: "slot_unknown",
      message: `Unknown slot "${name}". Files in ${SITE_SLOTS_DIR}/ must be one of: ${SITE_SLOT_NAMES.map((slot) => `${slot}.mdx`).join(", ")}`
    }
  ];
}
function substituteInstructions(instructions, fill, diagnostics) {
  if (instructions === undefined) {
    return;
  }
  const filled = typeof instructions === "string" ? fill(instructions, "markdown.instructions") ?? instructions : instructions.map((line, index) => fill(line, `markdown.instructions[${index}]`) ?? line);
  if (siteMarkdownSchema.safeParse({ instructions: filled }).success) {
    return filled;
  }
  diagnostics.push(configError("instructions_too_long", "markdown.instructions is over its length limit once variables are filled in. Shorten the text or the variables it uses."));
  return instructions;
}
function substituteSettingVariables(config) {
  const diagnostics = [];
  const fill = (text, setting) => {
    if (text === undefined || !text.includes("{{")) {
      return text;
    }
    const result = substituteSettingText(text, config.variables);
    for (const name of result.unknown) {
      diagnostics.push({
        severity: "warning",
        file: SITE_CONFIG_FILENAME,
        code: "variable_unknown",
        message: `${setting}: unknown variable {{ ${name} }}. Add "${name}" to variables. It is shown as written.`
      });
    }
    return result.text;
  };
  const instructions = substituteInstructions(config.markdown.instructions, fill, diagnostics);
  return {
    config: {
      ...config,
      description: fill(config.description, "description"),
      markdown: { ...config.markdown, instructions },
      banner: config.banner ? {
        ...config.banner,
        content: fill(config.banner.content, "banner.content") ?? config.banner.content
      } : undefined,
      blog: config.blog ? {
        ...config.blog,
        title: fill(config.blog.title, "blog.title"),
        description: fill(config.blog.description, "blog.description")
      } : undefined,
      changelog: config.changelog ? {
        ...config.changelog,
        title: fill(config.changelog.title, "changelog.title"),
        description: fill(config.changelog.description, "changelog.description")
      } : undefined
    },
    diagnostics
  };
}
function configError(code, message) {
  return { severity: "error", file: SITE_CONFIG_FILENAME, code, message };
}
function parseSiteConfig(raw) {
  if (raw === undefined || raw === null) {
    return {
      config: null,
      diagnostics: [
        configError("config_missing", `Add a ${SITE_CONFIG_FILENAME} at the site root, e.g. { "name": "Acme" }`)
      ]
    };
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    return {
      config: null,
      diagnostics: [
        configError("config_json", `${SITE_CONFIG_FILENAME} is not valid JSON: ${errorMessage(error)}`)
      ]
    };
  }
  const diagnostics = unknownConfigKeyWarnings(json);
  const parsed = siteConfigSchema.safeParse(json);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      diagnostics.push(configError("config_invalid", `${issue.path.join(".") || "config"}: ${issue.message}`));
    }
    return { config: null, diagnostics };
  }
  const settings = substituteSettingVariables(parsed.data);
  diagnostics.push(...settings.diagnostics);
  return {
    config: {
      ...settings.config,
      blog: settings.config.blog ?? siteBlogSchema.parse({}),
      changelog: settings.config.changelog ?? siteChangelogSchema.parse({})
    },
    diagnostics
  };
}
function applyVariables(files, variables) {
  const sources = new Map(files);
  const diagnostics = [];
  for (const [path, content] of files) {
    if (content === null || !takesVariables(path) || !content.includes("{{")) {
      continue;
    }
    const substitution = substituteVariables(content, variables, MDX_FILE.test(path));
    sources.set(path, substitution.text);
    for (const unknown of substitution.unknown) {
      diagnostics.push({
        severity: "warning",
        file: path,
        ...offsetToLineColumn(content, unknown.offset),
        code: "variable_unknown",
        message: `Unknown variable {{ ${unknown.name} }}. Add "${unknown.name}" to variables in ${SITE_CONFIG_FILENAME}. It is shown as written.`
      });
    }
  }
  return { sources, diagnostics };
}
function validateCustomScript(path, source) {
  try {
    Parser2.parse(source, { ecmaVersion: "latest", sourceType: "script" });
    return [];
  } catch (error) {
    const syntax = acornSyntaxError(error);
    return [
      {
        severity: "error",
        file: path,
        ...offsetToLineColumn(source, syntax.offset),
        code: "script_syntax",
        message: `Syntax error: ${syntax.message}. Custom scripts are plain browser JavaScript, not modules.`
      }
    ];
  }
}
function validateSite(input) {
  const ignoreContent = input.files.get(SITE_IGNORE_FILENAME);
  if (ignoreContent === null || ignoreContent !== undefined && new TextEncoder().encode(ignoreContent).length > SITE_IGNORE_MAX_BYTES) {
    return {
      ok: false,
      config: null,
      entries: [],
      outputs: new Map,
      diagnostics: [
        {
          severity: "error",
          file: SITE_IGNORE_FILENAME,
          code: "ignore_file_invalid",
          message: `${SITE_IGNORE_FILENAME} must be readable and at most ${SITE_IGNORE_MAX_BYTES / 1024} KB`
        }
      ]
    };
  }
  const files = filterSiteFiles(input.files);
  const outputs = new Map;
  const paths = new Set([...files.keys()].filter((path) => !isCustomScriptPath(path)));
  const usesDefaultConfig = !files.has(SITE_CONFIG_FILENAME) && input.defaultConfig !== undefined;
  const { config, diagnostics } = parseSiteConfig(usesDefaultConfig ? JSON.stringify(input.defaultConfig) : files.get(SITE_CONFIG_FILENAME));
  if (usesDefaultConfig && config) {
    outputs.set(SITE_CONFIG_FILENAME, JSON.stringify(config));
  }
  const { sources, diagnostics: variableDiagnostics } = config ? applyVariables(files, config.variables) : { sources: new Map(files), diagnostics: [] };
  diagnostics.push(...variableDiagnostics);
  for (const path of files.keys()) {
    diagnostics.push(...validateSlotFile(path));
  }
  const componentExports = new Map;
  for (const [path, content] of files) {
    if (!SCRIPT_FILE.test(path) || content === null) {
      continue;
    }
    if (isCustomScriptPath(path)) {
      diagnostics.push(...validateCustomScript(path, content));
      continue;
    }
    const analysis = analyzeJsxSnippet(path, content);
    diagnostics.push(...analysis.diagnostics);
    componentExports.set(path, analysis.exportedNames);
    if (analysis.output !== null) {
      outputs.set(path, analysis.output);
    }
  }
  const mdxPaths = [...files.keys()].filter((path) => MDX_FILE.test(path));
  const analyses = new Map;
  const analyze = (path, isEntry) => {
    analyses.set(path, analyzeMdxFile(path, sources.get(path) ?? "", {
      files: paths,
      componentExports,
      isEntry
    }));
  };
  for (const path of mdxPaths) {
    analyze(path, entryCandidate(path) !== null);
  }
  const importedPaths = new Set([...analyses.values()].flatMap((analysis) => analysis.imports));
  for (const path of mdxPaths) {
    if (importedPaths.has(path) && entryCandidate(path) !== null) {
      analyze(path, false);
    }
  }
  diagnostics.push(...importCycleDiagnostics(mdxPaths, (path) => analyses.get(path)?.imports ?? []));
  for (const [path, analysis] of analyses) {
    diagnostics.push(...analysis.diagnostics);
    if (analysis.output !== null) {
      outputs.set(path, analysis.output);
    }
    if (analysis.inlineModule) {
      outputs.set(analysis.inlineModule.path, analysis.inlineModule.source);
    }
  }
  const entries = [];
  const seenSlugs = new Map;
  let unreadEntries = 0;
  const blogTags = new Set;
  for (const [path, content] of files) {
    const candidate = entryCandidate(path);
    if (!candidate || importedPaths.has(path)) {
      continue;
    }
    if (content === null) {
      unreadEntries += 1;
      continue;
    }
    if (!ENTRY_SLUG.test(candidate.slug)) {
      diagnostics.push({
        severity: "error",
        file: path,
        code: "slug_invalid",
        message: `The URL "${candidate.slug}" comes from the file name. Use lowercase letters, digits and dashes.`
      });
      continue;
    }
    const key = `${candidate.area}:${candidate.slug}`;
    const existing = seenSlugs.get(key);
    if (existing) {
      diagnostics.push({
        severity: "error",
        file: path,
        code: "slug_duplicate",
        message: `Same URL as ${existing}`
      });
      continue;
    }
    seenSlugs.set(key, path);
    const substituted = sources.get(path) ?? content;
    const frontmatter = parseEntryFrontmatter(path, candidate.area, substituted);
    diagnostics.push(...frontmatter.diagnostics);
    if (candidate.area === "blog") {
      for (const tag of frontmatter.data?.tags ?? []) {
        const slug = tagSlug(tag);
        if (slug) {
          blogTags.add(slug);
        }
      }
    }
    if (candidate.format === "md") {
      diagnostics.push(...blockedMarkdownHtml(path, substituted));
      if (substituted !== content) {
        outputs.set(path, substituted);
      }
    }
    entries.push({
      area: candidate.area,
      slug: candidate.slug,
      path,
      format: candidate.format
    });
  }
  if (config) {
    if (entries.length === 0 && unreadEntries === 0) {
      diagnostics.push({
        severity: "warning",
        file: null,
        code: "no_entries",
        message: "No posts yet. Add .mdx files to blog/ or changelog/."
      });
    }
    diagnostics.push(...featuredSlugWarnings(config, entries));
    diagnostics.push(...categoryWarnings(config, blogTags));
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return {
    diagnostics,
    config,
    entries,
    outputs,
    ok: !hasErrors(diagnostics)
  };
}

// ../../packages/sites-core/src/constants/mounts.ts
var MOUNT_SEGMENT = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

// ../../packages/sites-core/src/utils/mounts.ts
class SiteMountError extends Error {
  name = "SiteMountError";
}
function normalizeMountPath(input) {
  const trimmed = input.trim().toLowerCase();
  const segments = trimmed.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }
  if (segments.length > SITE_MOUNT_MAX_SEGMENTS) {
    throw new SiteMountError(`Mount "${input}" is nested too deep (max ${SITE_MOUNT_MAX_SEGMENTS} segments)`);
  }
  for (const segment of segments) {
    if (!MOUNT_SEGMENT.test(segment) || segment === "_notra") {
      throw new SiteMountError(`Mount "${input}" may only contain lowercase letters, digits and dashes`);
    }
  }
  return `/${segments.join("/")}`;
}
function isWithin(path, mount) {
  if (mount === "/") {
    return true;
  }
  return path === mount || path.startsWith(`${mount}/`);
}
function normalizeSiteMounts(mounts) {
  const normalized = {};
  for (const area of SITE_AREAS) {
    const value = mounts[area];
    if (value !== undefined) {
      normalized[area] = normalizeMountPath(value);
    }
  }
  if (normalized.blog && normalized.changelog) {
    if (normalized.blog === normalized.changelog) {
      throw new SiteMountError("Blog and changelog need different paths");
    }
    const nestedNonRoot = normalized.blog !== "/" && isWithin(normalized.changelog, normalized.blog) || normalized.changelog !== "/" && isWithin(normalized.blog, normalized.changelog);
    if (nestedNonRoot) {
      throw new SiteMountError("Blog and changelog paths may not be nested inside each other");
    }
  }
  if (!(normalized.blog ?? normalized.changelog)) {
    throw new SiteMountError("At least one area needs a path");
  }
  return normalized;
}
function listMountedAreas(mounts) {
  const areas = [];
  for (const area of SITE_AREAS) {
    const mount = mounts[area];
    if (mount) {
      areas.push({ area, mount });
    }
  }
  return areas;
}
function resolveAreaForPath(mounts, pathname) {
  let best = null;
  for (const entry of listMountedAreas(mounts)) {
    if (!isWithin(pathname, entry.mount)) {
      continue;
    }
    if (!best || entry.mount.length > best.mount.length) {
      best = entry;
    }
  }
  return best;
}
function joinMountPath(mount, path) {
  const tail = path.replace(/^\/+/, "");
  if (mount === "/") {
    return `/${tail}`;
  }
  return tail ? `${mount}/${tail}` : mount;
}
function pathCollidesWithOtherMount(mounts, area, urlPath) {
  const owner = resolveAreaForPath(mounts, urlPath);
  return owner !== null && owner.area !== area;
}

// compiler/build.ts
import { spawn } from "node:child_process";
import { cp as cp3, mkdir as mkdir4, readFile as readFile4, rm as rm3, stat as stat2, writeFile as writeFile2 } from "node:fs/promises";
import { createRequire as createRequire2 } from "node:module";
import { dirname as dirname3, join as join7, relative, resolve } from "node:path";

// ../../packages/sites-core/src/schemas/deployment.ts
import { z as z4 } from "zod";
var siteAreaSchema = z4.enum(SITE_AREAS);
var siteMountsSchema = z4.object({
  blog: z4.string().optional(),
  changelog: z4.string().optional()
}).refine((mounts) => Boolean(mounts.blog ?? mounts.changelog), {
  message: "At least one area needs a mount"
});
var siteBuildTargetSchema = z4.object({
  publicOrigin: z4.url(),
  mounts: siteMountsSchema,
  noindex: z4.boolean(),
  branding: z4.boolean().default(true),
  defaultConfig: siteConfigSchema.optional()
});
var siteManifestFileSchema = z4.object({
  path: z4.string().startsWith("/"),
  size: z4.number().int().nonnegative(),
  sha256: z4.string().length(64),
  contentType: z4.string(),
  immutable: z4.boolean().optional()
});
var siteRedirectRuleSchema = z4.object({
  source: z4.string().startsWith("/"),
  destination: z4.string(),
  status: z4.union([
    z4.literal(301),
    z4.literal(302),
    z4.literal(307),
    z4.literal(308)
  ])
});
var siteContentSecurityPolicySchema = z4.string().min(1).max(SITE_CSP_MAX_LENGTH).regex(/^[\u0020-\u007E]+$/);
var siteManifestSchema = z4.object({
  version: z4.literal(1),
  siteId: z4.string(),
  deploymentId: z4.string(),
  commitSha: z4.string(),
  toolchainVersion: z4.string(),
  target: siteBuildTargetSchema,
  configHash: z4.string(),
  createdAt: z4.string(),
  totalBytes: z4.number().int().nonnegative(),
  files: z4.array(siteManifestFileSchema),
  redirects: z4.array(siteRedirectRuleSchema),
  contentSecurityPolicy: siteContentSecurityPolicySchema.optional(),
  analyticsConsent: z4.boolean().optional(),
  consentBackendURL: z4.url().optional()
});
var siteServingPointerSchema = z4.object({
  deploymentId: z4.string(),
  generation: z4.number().int().nonnegative(),
  buildGeneration: z4.number().int().nonnegative().optional(),
  activatedAt: z4.string()
});
var sitePreviewPasswordSchema = z4.object({
  algorithm: z4.literal(SITE_PREVIEW_PASSWORD_ALGORITHM),
  iterations: z4.number().int().positive(),
  salt: z4.string().min(1),
  hash: z4.string().min(1),
  version: z4.string().min(1),
  updatedAt: z4.string()
});
var sitePreviewPointerSchema = z4.object({
  deploymentId: z4.string(),
  visibility: z4.enum(SITE_PREVIEW_VISIBILITIES),
  sequence: z4.number().int().nonnegative(),
  activatedAt: z4.string(),
  expiresAt: z4.string().nullable(),
  access: z4.object({ password: sitePreviewPasswordSchema.nullable() }).optional()
});
var siteServingStateSchema = z4.object({
  version: z4.literal(1),
  siteId: z4.string(),
  slug: z4.string(),
  status: z4.enum(SITE_STATUSES),
  production: siteServingPointerSchema.nullable(),
  productionRollback: z4.boolean().default(false),
  previews: z4.record(z4.string(), sitePreviewPointerSchema),
  removedPreviews: z4.record(z4.string(), z4.number().int().nonnegative()).default({}),
  previewPassword: sitePreviewPasswordSchema.nullable().default(null),
  trafficToken: z4.string().nullable().default(null),
  revokedSessions: z4.record(z4.string(), z4.object({
    sessions: z4.number().int().nonnegative().optional(),
    shareLinks: z4.number().int().nonnegative().optional()
  })).default({}),
  updatedAt: z4.string()
});
var siteHostRecordSchema = z4.object({
  version: z4.literal(1),
  siteId: z4.string(),
  kind: z4.enum(["alias", "custom"])
});

// ../../packages/sites-core/src/schemas/build.ts
import { z as z5 } from "zod";
var siteDiagnosticSchema = z5.object({
  severity: z5.enum(["error", "warning"]),
  file: z5.string().nullable(),
  line: z5.number().int().positive().optional(),
  column: z5.number().int().positive().optional(),
  code: z5.string(),
  message: z5.string()
});
var siteBuildRequestSchema = z5.object({
  siteId: z5.string().min(1),
  deploymentId: z5.string().min(1),
  commitSha: z5.string().default(""),
  publicOrigin: z5.url(),
  mounts: siteMountsSchema,
  noindex: z5.boolean().default(false),
  includeDrafts: z5.boolean().default(false),
  analytics: z5.boolean().default(false),
  branding: z5.boolean().default(true),
  defaultConfig: siteConfigSchema.optional()
});
var siteBuildRedirectSchema = z5.object({
  source: z5.string().startsWith("/").max(500),
  destination: z5.string().max(2000).regex(/^(?:\/(?!\/)|https?:\/\/)/),
  permanent: z5.boolean().default(true)
});
var siteBuildResultSchema = z5.object({
  ok: z5.boolean(),
  diagnostics: z5.array(siteDiagnosticSchema).max(1000),
  areas: z5.array(z5.object({
    area: siteAreaSchema,
    mount: z5.string(),
    durationMs: z5.number()
  })),
  fileCount: z5.number().int().nonnegative(),
  totalBytes: z5.number().int().nonnegative(),
  redirects: z5.array(siteBuildRedirectSchema).max(500),
  contentSecurityPolicy: siteContentSecurityPolicySchema.nullable().default(null),
  analyticsConsent: z5.boolean().optional(),
  consentBackendURL: z5.url().optional()
});

// ../../packages/sites-core/src/utils/data-attributes.ts
function dataAttributes(options) {
  const attributes = {};
  for (const [key, value] of Object.entries(options)) {
    const name = key.replace(CAMEL_CASE_BOUNDARY, (letter) => `-${letter.toLowerCase()}`);
    attributes[`data-${name}`] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return attributes;
}

// ../../packages/sites-core/src/utils/integrations.ts
function inlineScriptLiteral(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
}
function integrationHeadScripts(integrations) {
  const scripts = [];
  const { databuddy, ga4, plausible, posthog, umami } = integrations;
  if (databuddy) {
    const { scriptUrl, ...options } = databuddy;
    scripts.push({
      kind: "external",
      src: scriptUrl ?? DATABUDDY_SCRIPT_URL,
      attributes: {
        async: true,
        crossorigin: "anonymous",
        ...dataAttributes(options)
      }
    });
  }
  if (ga4) {
    scripts.push({
      kind: "external",
      src: `${GOOGLE_TAG_ORIGIN}/gtag/js?id=${encodeURIComponent(ga4.measurementId)}`,
      attributes: { async: true }
    }, {
      kind: "inline",
      code: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config",${inlineScriptLiteral(ga4.measurementId)});`
    });
  }
  if (plausible) {
    scripts.push({
      kind: "external",
      src: plausible.server ? `https://${plausible.server}/js/script.js` : PLAUSIBLE_SCRIPT_URL,
      attributes: { "data-domain": plausible.domain, defer: true }
    });
  }
  if (posthog) {
    const options = {
      api_host: posthog.apiHost ?? POSTHOG_DEFAULT_API_HOST,
      disable_session_recording: posthog.sessionRecording === false
    };
    scripts.push({
      kind: "inline",
      code: `${POSTHOG_LOADER}posthog.init(${inlineScriptLiteral(posthog.apiKey)},${inlineScriptLiteral(options)});`
    });
  }
  if (umami) {
    scripts.push({
      kind: "external",
      src: umami.scriptUrl ?? UMAMI_SCRIPT_URL,
      attributes: {
        "data-website-id": umami.websiteId,
        ...umami.hostUrl ? { "data-host-url": umami.hostUrl } : {},
        defer: true
      }
    });
  }
  return scripts;
}
function analyticsGatedByConsent(integrations) {
  return integrations.c15t !== undefined;
}
function integrationCspSources(integrations) {
  const scriptSrc = [];
  const connectSrc = [];
  const { c15t, databuddy, ga4, plausible, posthog, umami } = integrations;
  if (c15t) {
    connectSrc.push(new URL(c15t.backendURL).origin);
  }
  if (databuddy) {
    scriptSrc.push(new URL(databuddy.scriptUrl ?? DATABUDDY_SCRIPT_URL).origin);
    connectSrc.push(new URL(databuddy.apiUrl ?? DATABUDDY_API_URL).origin);
  }
  if (ga4) {
    scriptSrc.push(GOOGLE_TAG_ORIGIN);
    connectSrc.push(...GOOGLE_ANALYTICS_CONNECT_ORIGINS);
  }
  if (plausible) {
    const origin = plausible.server ? `https://${plausible.server}` : new URL(PLAUSIBLE_SCRIPT_URL).origin;
    scriptSrc.push(origin);
    connectSrc.push(origin);
  }
  if (posthog) {
    scriptSrc.push(POSTHOG_CSP_ORIGIN);
    connectSrc.push(POSTHOG_CSP_ORIGIN);
    if (posthog.apiHost) {
      const origin = new URL(posthog.apiHost).origin;
      scriptSrc.push(origin);
      connectSrc.push(origin);
    }
  }
  if (umami) {
    const scriptOrigin = new URL(umami.scriptUrl ?? UMAMI_SCRIPT_URL).origin;
    let connectOrigin = scriptOrigin;
    if (umami.hostUrl) {
      connectOrigin = new URL(umami.hostUrl).origin;
    } else if (scriptOrigin === new URL(UMAMI_SCRIPT_URL).origin) {
      connectOrigin = UMAMI_CONNECT_ORIGIN;
    }
    scriptSrc.push(scriptOrigin);
    connectSrc.push(connectOrigin);
  }
  return { scriptSrc, connectSrc };
}

// ../../packages/sites-core/src/utils/content-security-policy.ts
function sortedUnique(values) {
  return [...new Set(values)].sort();
}
function buildSiteContentSecurityPolicy(params) {
  if (!params.security.contentSecurityPolicy) {
    return null;
  }
  const integrations = integrationCspSources(params.integrations);
  const allowed = params.security.allowedOrigins;
  const scriptOrigins = [
    ...integrations.scriptSrc,
    ...allowed.filter((origin) => origin.startsWith("https://"))
  ];
  const scriptSrc = [
    "'self'",
    ...params.security.webAssembly ? ["'wasm-unsafe-eval'"] : [],
    ...sortedUnique(params.scriptHashes).map((hash) => `'sha256-${hash}'`),
    ...sortedUnique(scriptOrigins)
  ];
  const connectSrc = [
    "'self'",
    ...sortedUnique([...integrations.connectSrc, ...allowed])
  ];
  return [
    `script-src ${scriptSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    ...params.integrations.posthog && params.integrations.posthog.sessionRecording !== false ? [
      `worker-src 'self' blob: data: ${sortedUnique(scriptOrigins).join(" ")}`
    ] : [],
    ...SITE_CSP_STATIC_DIRECTIVES
  ].join("; ");
}

// src/constants/public-assets.ts
var URL_ATTRIBUTE = /\b(src|href|poster|content|data-src)=(["'])(\/[^"']*)\2/g;
var SRCSET_ATTRIBUTE = /\bsrcset=(["'])([^"']*)\1/g;

// src/utils/public-assets.ts
function rewritePublicAssetUrls(html, mount, publicFiles) {
  if (mount === "/" || publicFiles.size === 0) {
    return html;
  }
  const rewrite = (url) => {
    const match = /^([^?#]*)(.*)$/.exec(url);
    const path = match?.[1] ?? url;
    let decoded = path;
    try {
      decoded = decodeURI(path);
    } catch {
      decoded = path;
    }
    return publicFiles.has(decoded) ? `${mount}${path}${match?.[2] ?? ""}` : url;
  };
  return html.replace(URL_ATTRIBUTE, (whole, name, quote, url) => url.startsWith("//") ? whole : `${name}=${quote}${rewrite(url)}${quote}`).replace(SRCSET_ATTRIBUTE, (_whole, quote, value) => {
    const rewritten = value.split(",").map((candidate) => {
      const [url = "", ...descriptor] = candidate.trim().split(/\s+/);
      return [
        url.startsWith("/") && !url.startsWith("//") ? rewrite(url) : url,
        ...descriptor
      ].join(" ");
    }).join(", ");
    return `srcset=${quote}${rewritten}${quote}`;
  });
}

// compiler/agent-files.ts
import { join as join2 } from "node:path";

// src/constants/areas.ts
var AREA_DEFAULT_TITLES = {
  blog: "Blog",
  changelog: "Changelog"
};

// src/utils/area-titles.ts
function configuredAreaTitle(config, area) {
  return config[area]?.title ?? AREA_DEFAULT_TITLES[area];
}
function withSiteName(siteName, title, separator = " ") {
  return title.startsWith(siteName) ? title : `${siteName}${separator}${title}`;
}

// compiler/constants/agent-files.ts
var AGENT_INSTRUCTIONS_HEADING = "## Instructions for AI agents";
var WHEN_TO_USE_HEADING = "## When to use this site";
var WHEN_TO_USE_AREA = {
  blog: "for product context, announcements and background from the team",
  changelog: "to find out what changed and when, including version numbers"
};

// compiler/utils/fs.ts
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
async function listFiles(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
}
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function writeFileEnsured(path, content) {
  const existing = await readFile(path).catch(() => null);
  if (existing?.equals(Buffer.from(content))) {
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

// compiler/utils/html-to-markdown.ts
import { fromHtml } from "hast-util-from-html";
import { toMdast } from "hast-util-to-mdast";
import { gfmToMarkdown } from "mdast-util-gfm";
import { toMarkdown } from "mdast-util-to-markdown";
import { SKIP, visit as visit4 } from "unist-util-visit";

// compiler/constants/markdown.ts
var DROPPED_TAGS = new Set([
  "script",
  "style",
  "template",
  "button",
  "svg",
  "noscript"
]);
var BLOCK_TAGS = new Set(["p", "div", "h2", "h3", "h4", "img"]);
var TEXT_BLOCK_TAGS = new Set(["p", "h2", "h3", "h4"]);

// compiler/utils/html-to-markdown.ts
function text(value) {
  return { type: "text", value };
}
function strong(value) {
  return {
    type: "element",
    tagName: "strong",
    properties: {},
    children: [text(value)]
  };
}
function paragraph(children) {
  return { type: "element", tagName: "p", properties: {}, children };
}
function findMarkdownRoot(tree) {
  let root = null;
  visit4(tree, "element", (node) => {
    if (node.properties.dataMdRoot !== undefined) {
      root = node;
      return false;
    }
    return;
  });
  return root;
}
function simplify(root) {
  visit4(root, "comment", (_node, index, parent) => {
    if (parent && index !== undefined) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }
    return;
  });
  visit4(root, "element", (node, index, parent) => {
    if (!parent || index === undefined) {
      return;
    }
    if (isDropped(node)) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }
    const props = node.properties;
    if (node.tagName === "pre" && typeof props.dataLanguage === "string") {
      const code = node.children.find((child) => child.type === "element" && child.tagName === "code");
      if (code && props.dataLanguage !== "plaintext") {
        code.properties.className = [`language-${props.dataLanguage}`];
      }
    }
    if (node.tagName === "aside" && typeof props.ariaLabel === "string") {
      node.tagName = "blockquote";
      let titled = false;
      visit4(node, "element", (inner) => {
        if (inner.properties.dataCalloutTitle !== undefined) {
          inner.children = [strong(textOf(inner))];
          titled = true;
        }
      });
      if (!titled) {
        node.children.unshift(paragraph([strong(props.ariaLabel)]));
      }
    }
    if (props.dataNotraTabTitle !== undefined || node.tagName === "summary") {
      node.tagName = "p";
      node.children = [strong(textOf(node))];
      return SKIP;
    }
    if (node.tagName === "a" && node.children.some((child) => child.type === "element" && BLOCK_TAGS.has(child.tagName))) {
      const [title = textOf(node), ...rest] = textBlocks(node);
      parent.children[index] = paragraph([
        { ...node, children: [text(title)] },
        ...rest.length > 0 ? [text(`: ${rest.join(" ")}`)] : []
      ]);
      return SKIP;
    }
    if (node.tagName === "figcaption") {
      node.tagName = "p";
      node.children = [
        {
          type: "element",
          tagName: "em",
          properties: {},
          children: node.children
        }
      ];
    }
    return;
  });
}
function isDropped(node) {
  return DROPPED_TAGS.has(node.tagName) || node.properties.dataMdSkip !== undefined;
}
function textOf(node) {
  if (node.type === "text") {
    return node.value;
  }
  if (node.type !== "element" || isDropped(node)) {
    return "";
  }
  return node.children.map(textOf).join("").trim();
}
function textBlocks(node) {
  const blocks = [];
  for (const child of node.children) {
    if (child.type !== "element" || isDropped(child)) {
      continue;
    }
    const hasOwnText = child.children.some((inner) => inner.type === "text" && inner.value.trim() !== "");
    if (TEXT_BLOCK_TAGS.has(child.tagName) || hasOwnText) {
      blocks.push(textOf(child));
    } else {
      blocks.push(...textBlocks(child));
    }
  }
  return blocks.filter(Boolean);
}
function absolutize(tree, pageUrl) {
  visit4(tree, (node) => {
    if ((node.type === "link" || node.type === "image") && node.url) {
      try {
        node.url = new URL(node.url, pageUrl).toString();
      } catch {
        return;
      }
    }
  });
}
function htmlToMarkdown(html, pageUrl) {
  const root = findMarkdownRoot(fromHtml(html));
  if (!root) {
    return "";
  }
  simplify(root);
  const mdast = toMdast({ type: "root", children: root.children });
  absolutize(mdast, pageUrl);
  return toMarkdown(mdast, {
    extensions: [gfmToMarkdown()],
    bullet: "-",
    fences: true,
    rule: "-"
  }).trim();
}

// compiler/agent-files.ts
function pageFile(pagePath, extension) {
  return joinMountPath(pagePath, `index.${extension}`);
}
function metaLines(entry, url) {
  const lines = [`- URL: ${url}`, `- Published: ${entry.date}`];
  if (entry.updated && entry.updated !== entry.date) {
    lines.push(`- Updated: ${entry.updated}`);
  }
  if (entry.version) {
    lines.push(`- Version: ${entry.version}`);
  }
  if (entry.authors && entry.authors.length > 0) {
    lines.push(`- Authors: ${entry.authors.join(", ")}`);
  }
  if (entry.tags.length > 0) {
    lines.push(`- Tags: ${entry.tags.join(", ")}`);
  }
  return lines;
}
function entryMarkdown(entry, url, body) {
  const parts = [`# ${entry.title}`];
  if (entry.description) {
    parts.push(`> ${entry.description}`);
  }
  parts.push(metaLines(entry, url).join(`
`));
  if (body) {
    parts.push(body);
  }
  return `${parts.join(`

`)}
`;
}
function entryLink(entry, origin) {
  const details = [entry.version, entry.date].filter(Boolean).join(", ");
  const summary = entry.description ?? entry.summary;
  const description = summary ? `: ${summary}` : "";
  return `- [${entry.title}](${new URL(`${entry.path}.md`, origin)})${description} (${details})`;
}
function indexMarkdown(pages, origin) {
  const entries = pages.entries.filter((entry) => !entry.hidden);
  const parts = [`# ${pages.title}`];
  if (pages.description) {
    parts.push(`> ${pages.description}`);
  }
  parts.push(entries.length > 0 ? entries.map((entry) => entryLink(entry, origin)).join(`
`) : "_No entries yet._");
  return `${parts.join(`

`)}
`;
}
function normalizeAgentInstructions(instructions) {
  const list = typeof instructions === "string" ? [instructions] : instructions ?? [];
  return list.map((line) => line.trim()).filter(Boolean);
}
function instructionsSection(instructions) {
  if (instructions.length === 0) {
    return null;
  }
  const body = instructions.length === 1 ? instructions[0] ?? "" : instructions.map((line) => `- ${line}`).join(`
`);
  return `${AGENT_INSTRUCTIONS_HEADING}

${body}`;
}
function whenToUseSection(params) {
  return [
    WHEN_TO_USE_HEADING,
    "",
    `- Use this site as the first-party source for ${params.siteName ?? params.name}.`,
    ...params.areas.map((area) => `- Use [${area.title}](${new URL(area.indexPath, params.origin)}) ${WHEN_TO_USE_AREA[area.area]}.`)
  ].join(`
`);
}
function llmsTxt(params) {
  const parts = [`# ${params.name}`];
  if (params.description) {
    parts.push(`> ${params.description}`);
  }
  const instructions = instructionsSection(params.instructions);
  if (instructions) {
    parts.push(instructions);
  }
  parts.push(whenToUseSection(params));
  parts.push([
    "Every page is also available as Markdown: append `.md` to its URL or request it with `Accept: text/markdown`.",
    `When you quote or summarize a page, cite its HTML URL (without \`.md\`) on ${params.origin}. Entries are listed newest first with their publish date; the Markdown pages also give the authors, the last update and, for changelog entries, the version.`
  ].join(" "));
  for (const area of params.areas) {
    const entries = area.entries.filter((entry) => !entry.hidden && entry.indexable);
    parts.push([
      `## ${area.title}`,
      "",
      `- [${area.title} index](${new URL(pageFile(area.indexPath, "md"), params.origin)})${area.description ? `: ${area.description}` : ""}`,
      ...entries.map((entry) => entryLink(entry, params.origin))
    ].join(`
`));
  }
  parts.push([
    "## Optional",
    "",
    `- [Full text](${new URL(params.fullTextPath, params.origin)}): every page above in one file`,
    ...params.areas.flatMap((area) => [
      `- [${area.title} RSS feed](${new URL(joinMountPath(area.indexPath, "feed.xml"), params.origin)}): new ${area.area === "blog" ? "posts" : "entries"} as they are published`,
      `- [${area.title} sitemap](${new URL(joinMountPath(area.indexPath, "sitemap.xml"), params.origin)}): every page with its last modification date`
    ])
  ].join(`
`));
  return `${parts.join(`

`)}
`;
}
async function writeAgentFiles(params) {
  const { outDir, origin } = params;
  const instructions = instructionsSection(params.instructions);
  const fullText = new Map;
  const writes = [];
  for (const area of params.areas) {
    const texts = [];
    for (const entry of area.entries) {
      const url = new URL(entry.path, origin).toString();
      const html = params.pageHtml.get(pageFile(entry.path, "html")) ?? "";
      const markdown = entryMarkdown(entry, url, htmlToMarkdown(html, url));
      writes.push(writeFileEnsured(join2(outDir, pageFile(entry.path, "md")), instructions ? `${markdown}
${instructions}
` : markdown));
      if (!entry.hidden && entry.indexable) {
        texts.push(markdown);
      }
    }
    fullText.set(area.area, texts);
    const notFound = [
      `# ${params.notFound.title ?? "This page doesn't exist"}`,
      params.notFound.description ?? "It may have moved, or the link is wrong.",
      [
        `- [${area.title} index](${pageFile(area.indexPath, "md")})`,
        `- [llms.txt](${joinMountPath(area.indexPath, "llms.txt")}): a Markdown map of this site`
      ].join(`
`)
    ].join(`

`);
    writes.push(writeFileEnsured(join2(outDir, joinMountPath(area.indexPath, "404.md")), `${notFound}
`), writeFileEnsured(join2(outDir, pageFile(area.indexPath, "md")), indexMarkdown(area, origin)));
  }
  await Promise.all(writes);
  const scopes = [
    { prefix: "", areas: params.areas },
    ...params.areas.filter((area) => area.indexPath !== "/").map((area) => ({ prefix: area.indexPath, areas: [area] }))
  ];
  await Promise.all(scopes.map(async (scope) => {
    const fullTextPath = `${scope.prefix}/llms-full.txt`;
    const llmsPath = `${scope.prefix}/llms.txt`;
    const areaTitle = scope.prefix ? scope.areas[0]?.title : undefined;
    const name = areaTitle ? withSiteName(params.siteName, areaTitle) : params.siteName;
    if (!await exists(join2(outDir, llmsPath))) {
      await writeFileEnsured(join2(outDir, llmsPath), llmsTxt({
        name,
        siteName: params.siteName,
        description: params.siteDescription,
        areas: scope.areas,
        origin,
        fullTextPath,
        instructions: params.instructions
      }));
    }
    if (!await exists(join2(outDir, fullTextPath))) {
      const pages = scope.areas.flatMap((area) => fullText.get(area.area) ?? []);
      await writeFileEnsured(join2(outDir, fullTextPath), [
        instructions ? `# ${name}

${instructions}` : `# ${name}`,
        ...pages
      ].join(`

---

`));
    }
  }));
}

// compiler/constants/build.ts
var AREA_PAGES_FILE = "notra-pages.json";
var ASTRO_LOG_NOISE = [
  /\[glob-loader\] No files found matching/,
  /\[glob-loader\] The base directory .* does not exist/,
  /\[content\] The collection "(?:blog|changelog)" does not exist or is empty/,
  /┃ (?:Local|Network)\s+http:\/\/127\.0\.0\.1:\d+/
];
var SHIKI_UNKNOWN_LANGUAGE = /\[Shiki\] The language "([^"]+)" doesn't exist/;

// compiler/og-images.ts
import { readFile as readFile2 } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join as join3 } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

// src/constants/og.ts
var OG_MANIFEST_FILE = "og-manifest.json";

// compiler/constants/og-images.ts
var OG_IMAGE_WIDTH = 1200;
var OG_IMAGE_HEIGHT = 630;
var OG_IMAGES_DIR = "_notra/og";
var OG_FONT_SUBSETS = [
  "latin",
  "latin-ext",
  "cyrillic",
  "greek"
];
var OG_FONT_WEIGHTS = [400, 500, 600, 700];
var OG_FONT_FAMILY = OG_FONT_SUBSETS.map((subset) => `"Inter ${subset}"`).join(", ");
var OG_BACKGROUND_MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};
var OG_THEME = {
  light: { background: "#ffffff", text: "#0a0a0a", muted: "#6b7280" },
  dark: { background: "#0a0a0a", text: "#fafafa", muted: "#a1a1aa" }
};
var OG_TITLE_SIZES = [
  { maxLength: 40, size: 72 },
  { maxLength: 70, size: 60 },
  { maxLength: Number.POSITIVE_INFINITY, size: 50 }
];
var OG_ARTICLE_AVATAR_SIZE = 50;
var OG_ARTICLE_MAX_AVATARS = 4;
var OG_AUTHOR_AVATAR_SIZE = 64;
var OG_AUTHOR_LOGO_SIZE = 56;

// compiler/utils/og-card.ts
function titleSize(title) {
  const step = OG_TITLE_SIZES.find((candidate) => title.length <= candidate.maxLength) ?? OG_TITLE_SIZES[2];
  return step.size;
}

// compiler/components/og-article-card.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
function OgArticleCard(content) {
  const colors = OG_THEME[content.appearance];
  const { authors } = content;
  const avatar = (index, fill) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: OG_ARTICLE_AVATAR_SIZE,
    height: OG_ARTICLE_AVATAR_SIZE,
    marginLeft: index === 0 ? 0 : -12,
    borderRadius: OG_ARTICLE_AVATAR_SIZE / 2,
    border: `3px solid ${colors.background}`,
    backgroundColor: fill,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 600,
    objectFit: "cover"
  });
  return /* @__PURE__ */ jsxDEV("div", {
    style: {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      padding: "72px 80px",
      backgroundColor: colors.background,
      color: colors.text,
      fontFamily: OG_FONT_FAMILY,
      fontSize: 28,
      fontWeight: 500
    },
    children: [
      content.background ? /* @__PURE__ */ jsxDEV("img", {
        alt: "",
        height: OG_IMAGE_HEIGHT,
        src: content.background,
        style: { position: "absolute", top: 0, left: 0, objectFit: "cover" },
        width: OG_IMAGE_WIDTH
      }, undefined, false, undefined, this) : null,
      /* @__PURE__ */ jsxDEV("div", {
        style: { display: "flex", gap: 18 },
        children: [
          /* @__PURE__ */ jsxDEV("div", {
            style: { display: "flex" },
            children: content.date
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("div", {
            style: { display: "flex", color: colors.muted },
            children: content.category
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV("div", {
        style: {
          display: "block",
          flexGrow: 1,
          marginTop: 40,
          fontSize: titleSize(content.title),
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          lineClamp: content.description ? 2 : 3,
          wordBreak: "break-word"
        },
        children: content.title
      }, undefined, false, undefined, this),
      content.description ? /* @__PURE__ */ jsxDEV("div", {
        style: {
          display: "block",
          maxWidth: 920,
          marginBottom: 32,
          fontWeight: 400,
          lineHeight: 1.45,
          color: colors.muted,
          lineClamp: 2
        },
        children: content.description
      }, undefined, false, undefined, this) : null,
      /* @__PURE__ */ jsxDEV("div", {
        style: { display: "flex", alignItems: "center", gap: 14 },
        children: [
          authors.length > 0 ? /* @__PURE__ */ jsxDEV("div", {
            style: { display: "flex" },
            children: authors.slice(0, OG_ARTICLE_MAX_AVATARS).map((author, index) => author.avatar ? /* @__PURE__ */ jsxDEV("img", {
              alt: "",
              height: OG_ARTICLE_AVATAR_SIZE,
              src: author.avatar,
              style: avatar(index, colors.background),
              width: OG_ARTICLE_AVATAR_SIZE
            }, author.name, false, undefined, this) : /* @__PURE__ */ jsxDEV("div", {
              style: avatar(index, content.accent),
              children: author.name.charAt(0).toUpperCase()
            }, author.name, false, undefined, this))
          }, undefined, false, undefined, this) : null,
          authors.length === 0 && content.logo ? /* @__PURE__ */ jsxDEV("img", {
            alt: "",
            height: 44,
            src: content.logo,
            width: 44
          }, undefined, false, undefined, this) : null,
          /* @__PURE__ */ jsxDEV("div", {
            style: {
              display: "flex",
              color: authors.length > 0 ? colors.text : colors.muted
            },
            children: authors.length > 0 ? authors.map((author) => author.name).join(", ") : content.domain
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// compiler/components/og-author-card.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function OgAuthorCard(content) {
  const colors = OG_THEME[content.appearance];
  const { author } = content;
  return /* @__PURE__ */ jsxDEV2("div", {
    style: {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      padding: 80,
      backgroundColor: colors.background,
      color: colors.text,
      fontFamily: OG_FONT_FAMILY
    },
    children: [
      content.background ? /* @__PURE__ */ jsxDEV2("img", {
        alt: "",
        height: OG_IMAGE_HEIGHT / 2,
        src: content.background,
        style: { position: "absolute", bottom: 0, left: 0 },
        width: OG_IMAGE_WIDTH
      }, undefined, false, undefined, this) : null,
      /* @__PURE__ */ jsxDEV2("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: OG_AUTHOR_LOGO_SIZE
        },
        children: [
          content.logo ? /* @__PURE__ */ jsxDEV2("img", {
            alt: "",
            height: OG_AUTHOR_LOGO_SIZE,
            src: content.logo,
            width: OG_AUTHOR_LOGO_SIZE
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV2("div", {
            style: { display: "flex" }
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            style: {
              display: "flex",
              color: colors.muted,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.24em",
              textTransform: "uppercase"
            },
            children: content.label
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        style: {
          display: "flex",
          flex: 1,
          minHeight: 0,
          marginTop: 56,
          overflow: "hidden"
        },
        children: /* @__PURE__ */ jsxDEV2("div", {
          style: {
            display: "block",
            width: "100%",
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            lineClamp: 3,
            wordBreak: "break-word"
          },
          children: content.title
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        },
        children: [
          author ? /* @__PURE__ */ jsxDEV2("div", {
            style: { display: "flex", alignItems: "center", gap: 16 },
            children: [
              author.avatar ? /* @__PURE__ */ jsxDEV2("img", {
                alt: "",
                height: OG_AUTHOR_AVATAR_SIZE,
                src: author.avatar,
                style: {
                  borderRadius: OG_AUTHOR_AVATAR_SIZE / 2,
                  objectFit: "cover"
                },
                width: OG_AUTHOR_AVATAR_SIZE
              }, undefined, false, undefined, this) : null,
              /* @__PURE__ */ jsxDEV2("div", {
                style: { display: "flex", flexDirection: "column" },
                children: [
                  /* @__PURE__ */ jsxDEV2("div", {
                    style: { display: "flex", fontSize: 24, fontWeight: 600 },
                    children: author.name
                  }, undefined, false, undefined, this),
                  author.title ? /* @__PURE__ */ jsxDEV2("div", {
                    style: {
                      display: "flex",
                      marginTop: 2,
                      color: colors.muted,
                      fontSize: 18
                    },
                    children: author.title
                  }, undefined, false, undefined, this) : null
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV2("div", {
            style: { display: "flex" }
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            style: {
              display: "flex",
              color: colors.muted,
              fontSize: 20,
              fontWeight: 600
            },
            children: content.domain
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// compiler/components/og-card.tsx
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function OgCard(content) {
  const colors = OG_THEME[content.appearance];
  return /* @__PURE__ */ jsxDEV3("div", {
    style: {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "88px 88px 72px",
      backgroundColor: colors.background,
      color: colors.text,
      fontFamily: OG_FONT_FAMILY,
      position: "relative"
    },
    children: [
      content.background ? /* @__PURE__ */ jsxDEV3("img", {
        alt: "",
        height: OG_IMAGE_HEIGHT,
        src: content.background,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover"
        },
        width: OG_IMAGE_WIDTH
      }, undefined, false, undefined, this) : null,
      /* @__PURE__ */ jsxDEV3("div", {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_IMAGE_WIDTH,
          height: 12,
          backgroundColor: content.accent
        }
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("div", {
        style: {
          display: "flex",
          fontSize: 30,
          fontWeight: 500,
          color: colors.muted
        },
        children: content.eyebrow
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("div", {
        style: {
          display: "block",
          fontSize: titleSize(content.title),
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: "-0.025em",
          lineClamp: 3
        },
        children: content.title
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("div", {
        style: { display: "flex", alignItems: "center", fontSize: 28 },
        children: [
          /* @__PURE__ */ jsxDEV3("div", {
            style: {
              width: 16,
              height: 16,
              borderRadius: 8,
              marginRight: 16,
              backgroundColor: content.accent
            }
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3("div", {
            style: { display: "flex", color: colors.muted, fontWeight: 500 },
            children: content.footer
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// compiler/og-images.ts
var fontsPromise = null;
function loadFonts() {
  fontsPromise ??= (async () => {
    const require2 = createRequire(import.meta.url);
    const specs = OG_FONT_SUBSETS.flatMap((subset) => OG_FONT_WEIGHTS.map((weight) => ({ subset, weight })));
    return Promise.all(specs.map(async ({ subset, weight }) => ({
      name: `Inter ${subset}`,
      weight,
      style: "normal",
      data: await readFile2(require2.resolve(`@fontsource/inter/files/inter-${subset}-${weight}-normal.woff`))
    })));
  })();
  return fontsPromise;
}
function formatShortDate(date, now) {
  const sameYear = date.getUTCFullYear() === now.getUTCFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    ...sameYear ? {} : { year: "numeric" },
    timeZone: "UTC"
  }).format(date);
}
function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}
async function loadBackground(params) {
  const path = params.config.thumbnails.background;
  if (!path) {
    return {};
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const mimeType = OG_BACKGROUND_MIME_TYPES[extname(normalized).toLowerCase()];
  if (!(mimeType && params.publicFiles.includes(normalized))) {
    return {
      diagnostic: {
        severity: "warning",
        file: SITE_CONFIG_FILENAME,
        code: "thumbnail_background",
        message: `thumbnails.background: ${path} is not a PNG, JPEG or SVG file in public/. Share images are generated without it.`
      }
    };
  }
  const bytes = await readFile2(join3(params.workDir, "site", "public", normalized));
  return { dataUri: `data:${mimeType};base64,${bytes.toString("base64")}` };
}
async function publicImage(params, path) {
  if (!path || /^https?:\/\//.test(path)) {
    return;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const mimeType = OG_BACKGROUND_MIME_TYPES[extname(normalized).toLowerCase()];
  if (!(mimeType && params.publicFiles.includes(normalized))) {
    return;
  }
  const bytes = await readFile2(join3(params.workDir, "site", "public", normalized));
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}
async function resolveAuthor(params, ref) {
  const id = typeof ref === "string" ? ref : ref.id;
  const configured = id && Object.hasOwn(params.config.authors, id) ? params.config.authors[id] : undefined;
  const inline = typeof ref === "string" ? undefined : ref;
  const name = configured?.name ?? inline?.name ?? (typeof ref === "string" ? ref : undefined);
  if (!name) {
    return;
  }
  return {
    name,
    title: configured?.title ?? inline?.title,
    avatar: await publicImage(params, configured?.avatar ?? inline?.avatar)
  };
}
async function resolveAuthors(params, value) {
  const refs = value === undefined ? [] : [value].flat();
  const authors = await Promise.all(refs.map((ref) => resolveAuthor(params, ref)));
  return authors.filter((author) => author !== undefined);
}
function authorWithFallback(author, logo) {
  return author && !author.avatar && logo ? { ...author, avatar: logo } : author;
}
function siteLogo(config) {
  const { logo, favicon } = config;
  const path = typeof logo === "string" ? logo : logo?.light;
  return path ?? (typeof favicon === "string" ? favicon : favicon?.light);
}
async function renderPng(card, fonts) {
  const svg = await satori(card, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts
  });
  return new Resvg(svg, {
    fitTo: { mode: "width", value: OG_IMAGE_WIDTH }
  }).render().asPng();
}
function areaCard(params, area, style) {
  const { config } = params;
  const title = configuredAreaTitle(config, area);
  const section = config.thumbnails.label ?? AREA_DEFAULT_TITLES[area];
  if (config.thumbnails.layout === "article") {
    return OgArticleCard({
      ...style,
      date: config.name,
      category: section === title ? "" : section,
      title,
      description: config[area]?.description ?? config.description,
      authors: []
    });
  }
  if (config.thumbnails.layout === "author") {
    return OgAuthorCard({ ...style, label: section, title });
  }
  return OgCard({
    ...style,
    eyebrow: config.name,
    title,
    footer: style.domain
  });
}
async function writeCard(params, card, fonts, urlPath) {
  await writeFileEnsured(join3(params.workDir, "site", "public", urlPath), await renderPng(card, fonts));
}
async function writeOgImages(params) {
  const started = Date.now();
  const manifest = {};
  const diagnostics = [];
  const { config } = params;
  if (config.thumbnails.enabled) {
    const [fonts, background] = await Promise.all([
      loadFonts(),
      loadBackground(params)
    ]);
    if (background.diagnostic) {
      diagnostics.push(background.diagnostic);
    }
    const appearance = config.thumbnails.appearance;
    const style = {
      appearance,
      accent: appearance === "dark" ? config.colors.light ?? config.colors.primary : config.colors.primary,
      logo: await publicImage(params, siteLogo(config)),
      domain: new URL(params.publicOrigin).hostname.replace(/^www\./, ""),
      background: background.dataUri
    };
    const { accent, logo, domain } = style;
    const now = new Date;
    const areas = config.seo.image ? [] : params.areas;
    await Promise.all(areas.map(async (area) => {
      const urlPath = `/${OG_IMAGES_DIR}/${area}.png`;
      await writeCard(params, areaCard(params, area, style), fonts, urlPath);
      manifest[area] = urlPath;
    }));
    await Promise.all(params.entries.map(async (entry) => {
      const source = await readFile2(join3(params.workDir, "entries", entry.area, `${entry.slug}.${entry.format}`), "utf8");
      const { data } = parseEntryFrontmatter(entry.path, entry.area, source);
      if (!data || data.image || data.draft && !params.includeDrafts) {
        return;
      }
      const version = "version" in data ? data.version : undefined;
      const authors = config.thumbnails.layout !== "default" && "author" in data ? await resolveAuthors(params, data.author) : [];
      const areaTitle = configuredAreaTitle(config, entry.area);
      let card;
      if (config.thumbnails.layout === "article") {
        card = OgArticleCard({
          date: formatShortDate(data.date, now),
          category: data.tags[0] ?? config.thumbnails.label ?? areaTitle,
          title: data.title,
          description: data.description,
          domain,
          appearance,
          accent,
          logo,
          authors,
          background: background.dataUri
        });
      } else if (config.thumbnails.layout === "author") {
        card = OgAuthorCard({
          label: config.thumbnails.label ?? areaTitle,
          title: data.title,
          domain,
          appearance,
          logo,
          author: authorWithFallback(authors[0], logo),
          background: background.dataUri
        });
      } else {
        card = OgCard({
          eyebrow: withSiteName(config.name, areaTitle, " · "),
          title: data.title,
          footer: [version, formatDate(data.date)].filter(Boolean).join(" · "),
          appearance,
          accent,
          background: background.dataUri
        });
      }
      const urlPath = `/${OG_IMAGES_DIR}/${entry.area}/${entry.slug}.png`;
      await writeCard(params, card, fonts, urlPath);
      manifest[`${entry.area}/${entry.slug}`] = urlPath;
    }));
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFileEnsured(join3(params.workDir, OG_MANIFEST_FILE), `${JSON.stringify(sorted, null, 2)}
`);
  return { manifest: sorted, diagnostics, durationMs: Date.now() - started };
}

// compiler/prepare.ts
import { createHash as createHash2 } from "node:crypto";
import { cp as cp2, mkdir as mkdir3, readFile as readFile3, rm as rm2, stat } from "node:fs/promises";
import { dirname as dirname2, join as join6, sep } from "node:path";

// ../../packages/sites-core/src/utils/source-files.ts
function isSiteContentPath(path) {
  return SITE_SOURCE_ROOTS.has(path.split("/")[0] ?? "");
}
function isSiteStylesheet(path) {
  return path.toLowerCase().endsWith(".css");
}
function isSiteSourcePath(path) {
  return path === SITE_IGNORE_FILENAME || isSiteContentPath(path) || isSiteStylesheet(path) || isCustomScriptPath(path);
}
function isCollectedSiteSourcePath(path) {
  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment.startsWith(".") || segment === "node_modules" || !SITE_SOURCE_SAFE_SEGMENT.test(segment))) {
    return false;
  }
  const name = segments.at(-1) ?? "";
  const dot = name.lastIndexOf(".");
  return dot >= 0 && SITE_SOURCE_ALLOWED_EXTENSIONS.has(name.slice(dot).toLowerCase()) && isSiteSourcePath(path);
}

// compiler/collect.ts
import { constants } from "node:fs";
import { lstat, open, opendir } from "node:fs/promises";
import { join as join4 } from "node:path";
async function collectSiteSource(siteRoot) {
  const files = [];
  const diagnostics = [];
  let totalBytes = 0;
  let ignoreContent = null;
  try {
    const file = await open(join4(siteRoot, SITE_IGNORE_FILENAME), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const stats = await file.stat();
      if (!stats.isFile() || stats.size > SITE_IGNORE_MAX_BYTES) {
        throw new Error(`${SITE_IGNORE_FILENAME} must be a regular file of at most ${SITE_IGNORE_MAX_BYTES / 1024} KB`);
      }
      ignoreContent = await file.readFile("utf8");
    } finally {
      await file.close();
    }
  } catch (error) {
    if (!(error instanceof Error && ("code" in error) && error.code === "ENOENT")) {
      diagnostics.push({
        severity: "error",
        file: SITE_IGNORE_FILENAME,
        code: "ignore_file_invalid",
        message: `Cannot read ${SITE_IGNORE_FILENAME}: ${error instanceof Error ? error.message : String(error)}`
      });
      return { files, totalBytes, diagnostics, ignoreContent };
    }
  }
  const isIgnored = createSiteIgnore(ignoreContent ?? "");
  async function inspect(relativePath) {
    const name = relativePath.slice(relativePath.lastIndexOf("/") + 1);
    if (name.startsWith(".") || name === "node_modules") {
      return { kind: "skip" };
    }
    const content = isSiteContentPath(relativePath);
    if (!(content || SITE_SOURCE_SAFE_SEGMENT.test(name))) {
      return { kind: "skip" };
    }
    if (!SITE_SOURCE_SAFE_SEGMENT.test(name)) {
      return {
        kind: "diagnostic",
        diagnostic: {
          severity: "warning",
          file: relativePath,
          code: "unsafe_filename",
          message: "Skipped: file names may only use letters, digits, spaces and ._-@()+"
        }
      };
    }
    const stats = await lstat(join4(siteRoot, relativePath));
    if (isIgnored(stats.isDirectory() ? `${relativePath}/` : relativePath)) {
      return { kind: "skip" };
    }
    if (stats.isSymbolicLink()) {
      return {
        kind: "diagnostic",
        diagnostic: {
          severity: "warning",
          file: relativePath,
          code: "symlink_skipped",
          message: "Skipped: symbolic links are not followed"
        }
      };
    }
    if (stats.isDirectory()) {
      return { kind: "directory", path: relativePath };
    }
    if (!stats.isFile() || !isCollectedSiteSourcePath(relativePath)) {
      return { kind: "skip" };
    }
    if (stats.size > SITE_BUILD_LIMITS.maxSingleFileBytes) {
      return {
        kind: "diagnostic",
        diagnostic: {
          severity: "error",
          file: relativePath,
          code: "file_too_large",
          message: `File is larger than ${SITE_BUILD_LIMITS.maxSingleFileBytes / 1024 / 1024} MB`
        }
      };
    }
    return { kind: "file", file: { path: relativePath, size: stats.size } };
  }
  const directories = [""];
  let stopped = false;
  while (directories.length > 0 && !stopped) {
    const relativeDir = directories.pop() ?? "";
    const directory = await opendir(join4(siteRoot, relativeDir));
    for await (const entry of directory) {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const result = await inspect(relativePath);
      if (result.kind === "diagnostic") {
        diagnostics.push(result.diagnostic);
        if (result.diagnostic.severity === "error") {
          stopped = true;
          break;
        }
      } else if (result.kind === "directory") {
        directories.push(result.path);
      } else if (result.kind === "file") {
        if (files.length >= SITE_BUILD_LIMITS.maxSourceFiles) {
          diagnostics.push({
            severity: "error",
            file: null,
            code: "too_many_files",
            message: `The site has more than ${SITE_BUILD_LIMITS.maxSourceFiles} files; the limit is ${SITE_BUILD_LIMITS.maxSourceFiles}`
          });
          stopped = true;
          break;
        }
        if (result.file.size > SITE_BUILD_LIMITS.maxSourceBytes - totalBytes) {
          diagnostics.push({
            severity: "error",
            file: null,
            code: "source_too_large",
            message: `The site source is larger than ${SITE_BUILD_LIMITS.maxSourceBytes / 1024 / 1024} MB; the limit is ${SITE_BUILD_LIMITS.maxSourceBytes / 1024 / 1024} MB`
          });
          stopped = true;
          break;
        }
        totalBytes += result.file.size;
        files.push(result.file);
      }
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { files, totalBytes, diagnostics, ignoreContent };
}

// compiler/utils/site-fonts.ts
import { createHash } from "node:crypto";
import { cp, mkdir as mkdir2, mkdtemp, readdir as readdir2, rename, rm } from "node:fs/promises";
import { join as join5 } from "node:path";

// compiler/constants/fonts.ts
var GOOGLE_FONTS_CSS_URL = "https://fonts.googleapis.com/css2";
var GOOGLE_FONTS_LICENSE_URL = "https://raw.githubusercontent.com/google/fonts/main";
var FONT_LICENSE_LOCATIONS = [
  ["ofl", "OFL.txt"],
  ["apache", "LICENSE.txt"],
  ["ufl", "UFL.txt"]
];
var FONT_FETCH_TIMEOUT_MS = 30000;
var FONT_CSS_MAX_BYTES = 1e5;
var FONT_FILE_MAX_BYTES = 5000000;
var FONT_DOWNLOAD_CONCURRENCY = 4;
var FONT_URL_RE = /url\(\s*["']?([^\s"')]+)["']?\s*\)/g;
var FONT_PATH_RE = /^\/s\/[\w/-]+\.(woff2?|ttf|otf)$/;
var FONT_USER_AGENT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
var FONT_WEIGHT_RANGES = [
  [300, 800],
  [400, 700],
  [400, 400]
];
var FONT_COMMON_WEIGHTS = [300, 400, 500, 600, 700];
var DEFAULT_HEADING_WEIGHT = 600;

// compiler/utils/site-fonts.ts
class FontRequestError extends Error {
  status;
  constructor(status) {
    super(`Font download failed (${status})`);
    this.status = status;
  }
}
function discreteWeights(weights) {
  return [...new Set(weights)].sort((a, b) => a - b).join(";");
}
function weightCandidates(weights) {
  const explicit = weights.filter((weight) => weight !== undefined);
  if (!weights.includes(undefined)) {
    return [discreteWeights(explicit)];
  }
  const ranges = FONT_WEIGHT_RANGES.map(([min, max]) => {
    const low = Math.min(min, ...explicit);
    const high = Math.max(max, ...explicit);
    return low === high ? `${low}` : `${low}..${high}`;
  });
  return [
    ...new Set([
      ...ranges,
      discreteWeights([...FONT_COMMON_WEIGHTS, ...explicit]),
      discreteWeights([400, ...explicit]),
      "400"
    ])
  ];
}
function requestedWeights(fonts) {
  const headingWeight = fonts?.heading?.weight;
  const uses = [
    {
      spec: fonts?.body?.family ? fonts.body : fonts,
      weights: [fonts?.body?.weight ?? fonts?.weight]
    },
    {
      spec: fonts?.heading?.family ? fonts.heading : fonts?.family ? fonts : fonts?.body,
      weights: headingWeight === undefined ? [undefined, DEFAULT_HEADING_WEIGHT] : [headingWeight]
    }
  ];
  const families = new Map;
  for (const { spec, weights } of uses) {
    if (spec?.family && !spec.source) {
      families.set(spec.family, [
        ...families.get(spec.family) ?? [],
        ...weights
      ]);
    }
  }
  return families;
}
function googleFontsUrl(specs) {
  const url = new URL(GOOGLE_FONTS_CSS_URL);
  for (const [family, spec] of [...specs].sort(([a], [b]) => a.localeCompare(b))) {
    url.searchParams.append("family", `${family}:wght@${spec}`);
  }
  url.searchParams.set("display", "swap");
  return url;
}
async function firstSupportedSpec(family, options) {
  for (const spec of options) {
    try {
      await fetchFontAsset(googleFontsUrl(new Map([[family, spec]])).toString(), FONT_CSS_MAX_BYTES);
      return spec;
    } catch (error) {
      if (!(error instanceof FontRequestError && error.status === 400)) {
        throw error;
      }
    }
  }
  throw new Error(`Google Fonts has no ${family} in the requested weights`);
}
async function supportedFontsUrl(candidates) {
  const specs = await Promise.all([...candidates].map(async ([family, options]) => [family, await firstSupportedSpec(family, options)]));
  return googleFontsUrl(new Map(specs));
}
async function fetchFontAsset(url, maxBytes) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
    headers: { "User-Agent": FONT_USER_AGENT }
  });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new FontRequestError(response.status);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > maxBytes) {
        throw new Error("Font download exceeded its size limit");
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}
async function fetchFontLicense(family) {
  const directory = family.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [category, name] of FONT_LICENSE_LOCATIONS) {
    try {
      return await fetchFontAsset(`${GOOGLE_FONTS_LICENSE_URL}/${category}/${directory}/${name}`, FONT_CSS_MAX_BYTES);
    } catch {}
  }
  throw new Error(`Could not retrieve the redistribution license for ${family}`);
}
async function prepareSiteFonts(config, workDir) {
  const families = requestedWeights(config.fonts);
  if (families.size === 0) {
    return { publicFiles: [], diagnostics: [] };
  }
  let stagingDir;
  let publicDir;
  try {
    const candidates = new Map([...families].map(([family, weights]) => [
      family,
      weightCandidates(weights)
    ]));
    const url = googleFontsUrl(new Map([...candidates].map(([family, specs]) => [family, specs[0] ?? ""])));
    const key = createHash("sha256").update(url.toString()).update(JSON.stringify([...candidates])).digest("hex");
    const cacheRoot = join5(workDir, "font-cache");
    const cacheDir = join5(cacheRoot, key);
    const publicPath = `/${SITE_ASSETS_DIR}/fonts/${key}`;
    publicDir = join5(workDir, "site", "public", publicPath);
    if (!await exists(cacheDir)) {
      await mkdir2(cacheRoot, { recursive: true });
      stagingDir = await mkdtemp(join5(cacheRoot, "batch-"));
      try {
        await downloadSiteFonts(url, [...families.keys()], stagingDir, true);
      } catch (error) {
        if (!(error instanceof FontRequestError && error.status === 400)) {
          throw error;
        }
        await rm(stagingDir, { recursive: true, force: true });
        stagingDir = await mkdtemp(join5(cacheRoot, "batch-"));
        await downloadSiteFonts(await supportedFontsUrl(candidates), [...families.keys()], stagingDir, false);
      }
      await rename(stagingDir, cacheDir);
      stagingDir = undefined;
    }
    const names = await readdir2(cacheDir);
    const stylesheet = names.find((name) => name.endsWith(".css"));
    if (!stylesheet) {
      throw new Error("Cached font stylesheet is missing");
    }
    await cp(cacheDir, publicDir, { recursive: true });
    return {
      stylesheet: `${publicPath}/${stylesheet}`,
      publicFiles: names.map((name) => `${publicPath}/${name}`),
      diagnostics: []
    };
  } catch (error) {
    await Promise.all([stagingDir, publicDir].filter((path) => path !== undefined).map((path) => rm(path, { recursive: true, force: true })));
    return {
      publicFiles: [],
      diagnostics: [
        {
          severity: "warning",
          file: SITE_CONFIG_FILENAME,
          code: "font_download",
          message: `Could not bundle site fonts; system fonts will be used. ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}
async function downloadSiteFonts(url, families, stagingDir, requireEveryFamily) {
  const css = (await fetchFontAsset(url.toString(), FONT_CSS_MAX_BYTES)).toString("utf8");
  const urls = [
    ...new Set([...css.matchAll(FONT_URL_RE)].flatMap((match) => match[1] ? [match[1]] : []))
  ];
  if (urls.length === 0) {
    throw new Error("Font stylesheet contains no font files");
  }
  const served = css.toLowerCase();
  if (requireEveryFamily && families.some((family) => !served.includes(`font-family: '${family.toLowerCase()}'`))) {
    throw new FontRequestError(400);
  }
  const sources = urls.map((source) => {
    const parsed = new URL(source);
    if (parsed.protocol !== "https:" || parsed.host !== "fonts.gstatic.com" || parsed.username || parsed.password || parsed.search || parsed.hash || !FONT_PATH_RE.test(parsed.pathname)) {
      throw new Error("Unsupported font file URL");
    }
    return { source, extension: parsed.pathname.split(".").at(-1) };
  });
  const replacements = new Map;
  const downloads = families.map((family) => async () => {
    const license = await fetchFontLicense(family);
    const hash = createHash("sha256").update(license).digest("hex").slice(0, 16);
    await writeFileEnsured(join5(stagingDir, `font-license-${hash}.txt`), license);
  });
  downloads.push(...sources.map(({ source, extension }) => async () => {
    const bytes = await fetchFontAsset(source, FONT_FILE_MAX_BYTES);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const name = `font-${hash}.${extension}`;
    await writeFileEnsured(join5(stagingDir, name), bytes);
    replacements.set(source, `./${name}`);
  }));
  const results = await Promise.allSettled(Array.from({ length: FONT_DOWNLOAD_CONCURRENCY }, async () => {
    let download = downloads.shift();
    while (download) {
      await download();
      download = downloads.shift();
    }
  }));
  for (const result of results) {
    if (result.status === "rejected") {
      throw result.reason;
    }
  }
  const localCss = css.replace(FONT_URL_RE, (_, source) => `url("${replacements.get(source)}")`);
  if (/https?:\/\//i.test(localCss) || /@import/i.test(localCss)) {
    throw new Error("Unsupported external font stylesheet reference");
  }
  const hash = createHash("sha256").update(localCss).digest("hex").slice(0, 16);
  const stylesheet = `fonts-${hash}.css`;
  await writeFileEnsured(join5(stagingDir, stylesheet), localCss);
}

// compiler/prepare.ts
async function readSiteFiles(siteRoot) {
  const collected = await collectSiteSource(siteRoot);
  if (hasErrors(collected.diagnostics)) {
    return { collected, files: new Map };
  }
  const texts = await Promise.all(collected.files.map((file) => isTextSourceFile(file.path) ? readFile3(join6(siteRoot, file.path), "utf8") : null));
  const files = new Map(collected.files.map((file, index) => [file.path, texts[index] ?? null]));
  if (collected.ignoreContent !== null) {
    files.set(SITE_IGNORE_FILENAME, collected.ignoreContent);
  }
  return { collected, files };
}
async function prepareSite(params) {
  const { collected, files } = await readSiteFiles(params.siteRoot);
  if (hasErrors(collected.diagnostics)) {
    return {
      validation: {
        ok: false,
        config: null,
        diagnostics: [],
        entries: [],
        outputs: new Map
      },
      collectDiagnostics: collected.diagnostics,
      publicFiles: [],
      customScripts: []
    };
  }
  const validation = validateSite({
    files,
    defaultConfig: params.defaultConfig
  });
  const publicFiles = collected.files.filter((file) => file.path.startsWith("public/")).map((file) => file.path.slice("public".length));
  if (!(validation.ok && validation.config)) {
    return {
      validation,
      collectDiagnostics: collected.diagnostics,
      publicFiles,
      customScripts: []
    };
  }
  if (params.incremental) {
    const siteDir = join6(params.workDir, "site");
    const entriesDir = join6(params.workDir, "entries");
    const expected = new Set([
      ...collected.files.map((file) => join6(siteDir, file.path)),
      ...[...validation.outputs.keys()].map((path) => join6(siteDir, path)),
      ...validation.entries.map((entry) => join6(entriesDir, entry.area, `${entry.slug}.${entry.format}`))
    ]);
    const staged = [
      ...await listFiles(siteDir).catch(() => []),
      ...await listFiles(entriesDir).catch(() => [])
    ];
    const generated = `${join6(siteDir, "public", "_notra")}${sep}`;
    await Promise.all(staged.filter((path) => !expected.has(path) && !path.startsWith(generated)).map((path) => rm2(path, { force: true })));
    await Promise.all([...expected].map(async (path) => {
      const existing = await stat(path).catch(() => null);
      if (existing?.isDirectory()) {
        await rm2(path, { recursive: true, force: true });
      }
    }));
  } else {
    await rm2(join6(params.workDir, "site"), { recursive: true, force: true });
    await rm2(join6(params.workDir, "entries"), { recursive: true, force: true });
  }
  await Promise.all(SITE_AREAS.map((area) => mkdir3(join6(params.workDir, "entries", area), { recursive: true })));
  await Promise.all(collected.files.map(async (file) => {
    const target = join6(params.workDir, "site", file.path);
    const transformed = validation.outputs.get(file.path);
    if (transformed !== undefined) {
      await writeFileEnsured(target, transformed);
      return;
    }
    if (params.incremental) {
      await writeFileEnsured(target, await readFile3(join6(params.siteRoot, file.path)));
    } else {
      await mkdir3(dirname2(target), { recursive: true });
      await cp2(join6(params.siteRoot, file.path), target);
    }
  }));
  await Promise.all([...validation.outputs].filter(([path]) => !files.has(path)).map(([path, source]) => writeFileEnsured(join6(params.workDir, "site", path), source)));
  const customCss = collected.files.filter((file) => isSiteStylesheet(file.path)).map((file) => `@import ${JSON.stringify(join6(params.workDir, "site", file.path))};`).join(`
`);
  await writeFileEnsured(join6(params.workDir, "custom.css"), `${customCss}
`);
  await mkdir3(join6(params.workDir, "site", "public", SITE_ASSETS_DIR), {
    recursive: true
  });
  const customScripts = await Promise.all(sortCustomScriptPaths(collected.files.map((file) => file.path)).map(async (path) => {
    const source = await readFile3(join6(params.siteRoot, path));
    const name = path.replace(/\.js$/i, "").replace(/[^A-Za-z0-9_-]+/g, "-");
    const fileName = `custom-${name}.${createHash2("sha256").update(source).digest("hex").slice(0, 10)}.js`;
    await writeFileEnsured(join6(params.workDir, "site", "public", SITE_ASSETS_DIR, fileName), source);
    return { path, fileName };
  }));
  await Promise.all(validation.entries.map((entry) => writeFileEnsured(join6(params.workDir, "entries", entry.area, `${entry.slug}.${entry.format}`), validation.outputs.get(entry.path) ?? files.get(entry.path) ?? "")));
  const fonts = await prepareSiteFonts(validation.config, params.workDir);
  validation.diagnostics.push(...fonts.diagnostics);
  return {
    validation,
    collectDiagnostics: collected.diagnostics,
    publicFiles: [...publicFiles, ...fonts.publicFiles],
    customScripts,
    fontStylesheet: fonts.stylesheet
  };
}

// compiler/utils/astro-log.ts
function createAstroLogFilter() {
  const reportedLanguages = new Set;
  return (text) => text.split(`
`).filter((line) => {
    if (ASTRO_LOG_NOISE.some((pattern) => pattern.test(line))) {
      return false;
    }
    const language = SHIKI_UNKNOWN_LANGUAGE.exec(line)?.[1];
    if (language === undefined) {
      return true;
    }
    if (reportedLanguages.has(language)) {
      return false;
    }
    reportedLanguages.add(language);
    return true;
  }).join(`
`);
}

// compiler/constants/consent.ts
var CONSENT_SITE_COLORS = {
  primary: "var(--primary-button)",
  primaryHover: "color-mix(in oklab, var(--primary-button) 88%, var(--foreground))",
  textOnPrimary: "var(--primary-foreground)",
  surface: "var(--card)",
  surfaceHover: "var(--muted)",
  border: "var(--border)",
  borderHover: "color-mix(in oklab, var(--foreground) 20%, var(--border))",
  text: "var(--foreground)",
  textMuted: "var(--muted-foreground)",
  overlay: "color-mix(in oklab, var(--background) 60%, transparent)",
  switchTrack: "color-mix(in oklab, var(--foreground) 15%, var(--muted))",
  switchTrackActive: "var(--primary-button)",
  switchThumb: "var(--card)"
};
var CONSENT_RADII = {
  none: { sm: "0", md: "0", lg: "0" },
  small: { sm: "0.25rem", md: "0.375rem", lg: "0.5rem" },
  medium: { sm: "0.375rem", md: "0.5rem", lg: "0.75rem" },
  large: { sm: "0.5rem", md: "0.75rem", lg: "1rem" }
};
var CONSENT_SHADOWS = {
  sm: "0 1px 2px color-mix(in oklab, black 6%, transparent)",
  md: "0 2px 8px color-mix(in oklab, black 8%, transparent)",
  lg: "0 8px 24px color-mix(in oklab, black 10%, transparent)"
};
var DATABUDDY_CONNECTION_KEYS = new Set([
  "clientId",
  "scriptUrl",
  "apiUrl"
]);

// compiler/utils/consent.ts
function consentAnalytics({
  databuddy,
  ga4,
  plausible,
  posthog,
  umami
}) {
  const databuddyConfig = databuddy && {
    clientId: databuddy.clientId,
    scriptUrl: databuddy.scriptUrl,
    apiUrl: databuddy.apiUrl,
    options: Object.fromEntries(Object.entries(databuddy).filter(([key]) => !DATABUDDY_CONNECTION_KEYS.has(key)))
  };
  return {
    databuddy: databuddyConfig,
    gtag: ga4 && { id: ga4.measurementId },
    posthog: posthog && {
      id: posthog.apiKey,
      apiHost: posthog.apiHost ?? POSTHOG_DEFAULT_API_HOST,
      disableSessionRecording: posthog.sessionRecording === false
    },
    plausible: plausible && {
      domain: plausible.domain,
      scriptUrl: plausible.server ? `https://${plausible.server}/js/script.js` : undefined
    },
    umami: umami && {
      websiteId: umami.websiteId,
      scriptUrl: umami.scriptUrl,
      hostUrl: umami.hostUrl
    }
  };
}
function siteConsent(config, customScripts, analytics, dev) {
  const { c15t } = config.integrations;
  if (!c15t) {
    return null;
  }
  const gated = c15t.scripts ?? {};
  return {
    backendURL: analytics ? c15t.backendURL : null,
    devTools: dev && c15t.devTools,
    hideBranding: c15t.hideBranding ?? false,
    analytics: analytics && analyticsGatedByConsent(config.integrations) ? consentAnalytics(config.integrations) : null,
    scripts: customScripts.flatMap((script) => {
      const category = gated[script.path];
      return category ? [{ fileName: script.fileName, category }] : [];
    }),
    options: {
      ui: "react",
      colorScheme: "none",
      presentation: { prompt: c15t.prompt, preferences: c15t.preferences },
      legalLinks: c15t.legalLinks,
      i18n: c15t.locale ? { locale: c15t.locale, detectLanguage: false } : undefined,
      storageConfig: {
        crossSubdomain: c15t.crossSubdomain,
        defaultExpiryDays: c15t.expiryDays
      },
      disableAnimation: c15t.disableAnimation,
      theme: {
        colors: { ...CONSENT_SITE_COLORS, ...c15t.theme?.colors },
        dark: { ...CONSENT_SITE_COLORS, ...c15t.theme?.dark },
        typography: { fontFamily: "var(--font-body)" },
        radius: CONSENT_RADII[c15t.theme?.radius ?? "medium"],
        shadows: CONSENT_SHADOWS
      }
    }
  };
}
function consentScriptDiagnostics(config, customScripts) {
  const paths = new Set(customScripts.map((script) => script.path));
  return Object.keys(config.integrations.c15t?.scripts ?? {}).filter((path) => !paths.has(path)).map((path) => ({
    severity: "error",
    file: "blog.json",
    code: "consent_script_missing",
    message: `integrations.c15t.scripts lists ${path}, but there is no custom script at that path.`
  }));
}

// compiler/utils/head-scripts.ts
function siteHeadScripts(config, mount, customScripts, analytics) {
  const gated = config.integrations.c15t?.scripts ?? {};
  return [
    ...analytics && !analyticsGatedByConsent(config.integrations) ? integrationHeadScripts(config.integrations) : [],
    ...customScripts.filter((script) => !gated[script.path]).map((script) => ({
      kind: "external",
      src: joinMountPath(mount, `${SITE_ASSETS_DIR}/${script.fileName}`),
      attributes: { defer: true }
    }))
  ];
}

// compiler/utils/inline-scripts.ts
import { createHash as createHash3 } from "node:crypto";

// compiler/constants/inline-scripts.ts
var SCRIPT_ELEMENT = /<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi;
var SRC_ATTRIBUTE = /(?:^|\s)src\s*=/i;
var TYPE_ATTRIBUTE = /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
var EXECUTABLE_SCRIPT_TYPES = new Set([
  "",
  "module",
  "text/javascript",
  "application/javascript"
]);

// compiler/utils/inline-scripts.ts
function inlineScriptHashes(html) {
  const hashes = [];
  for (const [, attributes = "", body = ""] of html.matchAll(SCRIPT_ELEMENT)) {
    if (SRC_ATTRIBUTE.test(attributes) || body === "") {
      continue;
    }
    const type = TYPE_ATTRIBUTE.exec(attributes);
    const typeValue = (type?.[1] ?? type?.[2] ?? type?.[3] ?? "").trim().toLowerCase();
    if (!EXECUTABLE_SCRIPT_TYPES.has(typeValue)) {
      continue;
    }
    const text = body.replaceAll(`\r
`, `
`).replaceAll("\r", `
`);
    hashes.push(createHash3("sha256").update(text, "utf8").digest("base64"));
  }
  return hashes;
}

// compiler/utils/nested-links.ts
import { SAXParser } from "parse5-sax-parser";
function unnestLinks(html) {
  if (!/<a(?:\s|\/|>)/i.test(html)) {
    return html;
  }
  const parser = new SAXParser({ sourceCodeLocationInfo: true });
  const dropped = [];
  const edits = [];
  parser.on("startTag", (token) => {
    if (token.tagName !== "a") {
      return;
    }
    const inner = dropped.length > 0;
    dropped.push(inner);
    if (inner && token.sourceCodeLocation) {
      edits.push({ ...token.sourceCodeLocation, replacement: "<span>" });
    }
  });
  parser.on("endTag", (token) => {
    if (token.tagName === "a" && dropped.pop() && token.sourceCodeLocation) {
      edits.push({ ...token.sourceCodeLocation, replacement: "</span>" });
    }
  });
  parser.end(html);
  let result = "";
  let offset = 0;
  for (const edit of edits) {
    result += html.slice(offset, edit.startOffset) + edit.replacement;
    offset = edit.endOffset;
  }
  return result + html.slice(offset);
}

// compiler/utils/react.ts
function hasReactComponents(outputs) {
  return [...outputs.keys()].some((path) => /\.jsx?$/i.test(path) && !path.startsWith("public/") && !isCustomScriptPath(path));
}

// compiler/build.ts
function astroBin(toolchainRoot) {
  const require2 = createRequire2(join7(toolchainRoot, "package.json"));
  const packageJsonPath = require2.resolve("astro/package.json");
  const packageJson = require2(packageJsonPath);
  const bin = typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin.astro;
  return resolve(dirname3(packageJsonPath), bin ?? "astro.js");
}
function runAstro(toolchainRoot, command, paramsPath, extraArgs = [], onOutput = (chunk) => process.stderr.write(chunk)) {
  return new Promise((resolvePromise, reject) => {
    const args = command === "stop" ? ["dev", "stop"] : [command];
    const child = spawn(process.execPath, [astroBin(toolchainRoot), ...args, "--root", toolchainRoot, ...extraArgs], {
      cwd: toolchainRoot,
      env: {
        ...process.env,
        NOTRA_BUILD_PARAMS: paramsPath,
        ASTRO_TELEMETRY_DISABLED: "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    const filterOutput = createAstroLogFilter();
    const forward = (chunk) => {
      const text = filterOutput(chunk.toString());
      if (text.trim()) {
        onOutput(text);
      }
    };
    child.stdout.on("data", forward);
    child.stderr.on("data", forward);
    child.on("error", reject);
    child.on("close", (code) => resolvePromise(code ?? 1));
  });
}
async function writeBuildParams(path, params) {
  await writeFile2(path, JSON.stringify(params));
}
function failedBuild(diagnostics, areas = []) {
  return {
    ok: false,
    diagnostics,
    areas,
    fileCount: 0,
    totalBytes: 0,
    redirects: [],
    contentSecurityPolicy: null
  };
}
async function buildSite(options) {
  const workDir = options.workDir ?? join7(options.toolchainRoot, ".notra", "work");
  const mounts = normalizeSiteMounts(options.target.mounts);
  const prepared = await prepareSite({
    siteRoot: options.siteRoot,
    workDir,
    defaultConfig: options.target.defaultConfig
  });
  const diagnostics = [
    ...prepared.collectDiagnostics,
    ...prepared.validation.diagnostics
  ];
  const config = prepared.validation.config;
  if (config) {
    diagnostics.push(...consentScriptDiagnostics(config, prepared.customScripts));
  }
  if (hasErrors(diagnostics) || !(prepared.validation.ok && config)) {
    return failedBuild(diagnostics);
  }
  const ogImages = await writeOgImages({
    workDir,
    config,
    entries: prepared.validation.entries,
    publicFiles: prepared.publicFiles,
    includeDrafts: options.target.includeDrafts,
    publicOrigin: options.target.publicOrigin,
    areas: listMountedAreas(mounts).map(({ area }) => area)
  });
  diagnostics.push(...ogImages.diagnostics);
  const ogImagePaths = Object.values(ogImages.manifest);
  if (ogImagePaths.length > 0) {
    process.stderr.write(`Generated ${ogImagePaths.length} share images in ${ogImages.durationMs} ms
`);
  }
  const publicFileList = [...prepared.publicFiles, ...ogImagePaths];
  await rm3(join7(workDir, "out"), { recursive: true, force: true });
  await rm3(join7(workDir, "cache"), { recursive: true, force: true });
  await rm3(options.outDir, { recursive: true, force: true });
  await mkdir4(options.outDir, { recursive: true });
  const publicOrigin = new URL(options.target.publicOrigin).origin;
  const publicFiles = new Set(publicFileList);
  const areas = [];
  const areaPages = [];
  const consent = siteConsent(config, prepared.customScripts, options.target.analytics, false);
  const pageHtml = new Map;
  for (const { area, mount } of listMountedAreas(mounts)) {
    const paramsPath = join7(workDir, `params.${area}.json`);
    await writeBuildParams(paramsPath, {
      area,
      mount,
      publicOrigin,
      siteId: options.target.siteId,
      deploymentId: options.target.deploymentId,
      noindex: options.target.noindex,
      includeDrafts: options.target.includeDrafts,
      branding: options.target.branding,
      workDir,
      publicFiles: publicFileList,
      fontStylesheet: prepared.fontStylesheet,
      mounts,
      config,
      hasReactComponents: hasReactComponents(prepared.validation.outputs),
      headScripts: siteHeadScripts(config, mount, prepared.customScripts, options.target.analytics),
      consent
    });
    const started = Date.now();
    let log = "";
    const exitCode = await runAstro(options.toolchainRoot, "build", paramsPath, [], (chunk) => {
      log += chunk;
      process.stderr.write(chunk);
    });
    if (exitCode !== 0) {
      diagnostics.push({
        severity: "error",
        file: null,
        code: "build_failed",
        message: `Building the ${area} failed:
${log.trim().split(`
`).slice(-25).join(`
`)}`
      });
      return failedBuild(diagnostics, areas);
    }
    const areaOut = join7(workDir, "out", area);
    for (const file of await listFiles(areaOut)) {
      const relativePath = relative(areaOut, file).split("\\").join("/");
      if (relativePath === AREA_PAGES_FILE) {
        areaPages.push(JSON.parse(await readFile4(file, "utf8")));
        continue;
      }
      const urlPath = joinMountPath(mount, relativePath);
      if (pathCollidesWithOtherMount(mounts, area, urlPath)) {
        diagnostics.push({
          severity: "error",
          file: null,
          code: "mount_collision",
          message: `The ${area} page ${urlPath} overlaps another section's path. Rename it.`
        });
        continue;
      }
      const target = join7(options.outDir, urlPath);
      await mkdir4(dirname3(target), { recursive: true });
      if (file.endsWith(".html")) {
        const html = rewritePublicAssetUrls(unnestLinks(await readFile4(file, "utf8")), mount, publicFiles);
        pageHtml.set(urlPath, html);
        await writeFile2(target, html);
      } else {
        await cp3(file, target);
      }
    }
    const probePath = join7(options.outDir, mount, "_notra", "probe.txt");
    await mkdir4(dirname3(probePath), { recursive: true });
    await writeFile2(probePath, `notra-site=${options.target.siteId}
area=${area}
`);
    areas.push({ area, mount, durationMs: Date.now() - started });
  }
  await writeAgentFiles({
    outDir: options.outDir,
    origin: publicOrigin,
    siteName: config.name,
    siteDescription: config.description,
    areas: areaPages,
    pageHtml,
    instructions: normalizeAgentInstructions(config.markdown.instructions),
    notFound: config.errors[404]
  });
  const scriptHashes = new Set([...pageHtml.values()].flatMap((html) => inlineScriptHashes(html)));
  let contentSecurityPolicy = null;
  if (config.security.contentSecurityPolicy && scriptHashes.size > SITE_CSP_MAX_SCRIPT_HASHES) {
    diagnostics.push({
      severity: "error",
      file: null,
      code: "csp_too_many_inline_scripts",
      message: `The pages contain ${scriptHashes.size} different inline scripts; the limit is ${SITE_CSP_MAX_SCRIPT_HASHES}. Move them into scripts/*.js, or set security.contentSecurityPolicy to false in blog.json.`
    });
  } else {
    contentSecurityPolicy = buildSiteContentSecurityPolicy({
      integrations: options.target.analytics ? config.integrations : {},
      security: config.security,
      scriptHashes
    });
  }
  const outputFiles = await listFiles(options.outDir);
  const sizes = await Promise.all(outputFiles.map(async (file) => (await stat2(file)).size));
  return {
    ok: !hasErrors(diagnostics),
    diagnostics,
    areas,
    fileCount: outputFiles.length,
    totalBytes: sizes.reduce((sum, size) => sum + size, 0),
    redirects: config.redirects,
    contentSecurityPolicy,
    analyticsConsent: analyticsGatedByConsent(config.integrations),
    consentBackendURL: config.integrations.c15t?.backendURL
  };
}
async function readBuildTarget(path) {
  return siteBuildRequestSchema.parse(JSON.parse(await readFile4(path, "utf8")));
}

// compiler/constants/cli.ts
var USAGE = `notra-sites <command>

  validate [--source <dir>] [--target <file>] [--json]  Check settings, MDX and snippets
  build --source <dir> --target <file> --out <dir> [--json]
  dev [--source <dir>] [--target <file>] [--area blog|changelog] [--port 4321]   (serves every area; --area picks the one "/" redirects to)`;
var DEV_READY_TIMEOUT_MS = 60000;
var DEV_PORT_SEARCH_RANGE = 100;
var ASTRO_READY_URL = /http:\/\/127\.0\.0\.1:(\d+)(?=\D)/;
var ASTRO_READY_SCAN_CHARS = 512;
var DEV_STOP_TIMEOUT_MS = 5000;
var DEV_HMR_GENERATION_EVENT = "notra:page-generation";
var DEV_ERRORS_PATH = "/__notra-dev/errors";
var DEV_ERRORS_POLL_MS = 1000;
var DEV_PROXY_MAX_ATTEMPTS = 3;
var DEV_PROXY_RETRY_DELAY_MS = 50;
var DEV_PROXY_RETRY_ERRORS = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT"
]);
var DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

// compiler/dev-server.ts
import { spawn as spawn2 } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  watch
} from "node:fs";
import { createServer, request } from "node:http";
import { connect, createServer as createNetServer } from "node:net";
import { dirname as dirname4, join as join8, relative as relative2 } from "node:path";
import { pipeline } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";

// compiler/utils/dev-error-page.ts
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function diagnosticLocation(diagnostic) {
  if (!diagnostic.file) {
    return "site";
  }
  if (!diagnostic.line) {
    return diagnostic.file;
  }
  return `${diagnostic.file}:${diagnostic.line}${diagnostic.column ? `:${diagnostic.column}` : ""}`;
}
function devErrorPage(errors) {
  const items = errors.map((error) => `<li><code>${escapeHtml(diagnosticLocation(error))}</code><p>${escapeHtml(error.message)}</p></li>`).join("");
  const title = errors.length === 1 ? "1 error" : `${errors.length} errors`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Notra Sites preview</title>
<style>
:root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
body { margin: 0; padding: 48px 24px; }
main { max-width: 720px; margin: 0 auto; }
h1 { font-size: 20px; margin: 0 0 4px; }
.hint { margin: 0 0 24px; opacity: 0.7; }
ul { list-style: none; margin: 0; padding: 0; }
li { border: 1px solid color-mix(in oklab, currentColor 18%, transparent); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; }
code { font-family: ui-monospace, monospace; font-size: 13px; color: #dc2626; }
li p { margin: 6px 0 0; white-space: pre-wrap; }
</style>
</head>
<body>
<main>
<h1>Your site has ${title}</h1>
<p class="hint">Fix ${errors.length === 1 ? "it" : "them"} and this page reloads.</p>
<ul>${items}</ul>
</main>
<script>
const poll = async () => {
  try {
    const response = await fetch(${JSON.stringify(DEV_ERRORS_PATH)}, { cache: "no-store" });
    const { count } = await response.json();
    if (count === 0) {
      location.reload();
      return;
    }
  } catch {}
  setTimeout(poll, ${DEV_ERRORS_POLL_MS});
};
setTimeout(poll, ${DEV_ERRORS_POLL_MS});
</script>
</body>
</html>`;
}

// compiler/utils/dev-host.ts
function isLocalDevHost(host) {
  try {
    const url = new URL(`http://${host ?? ""}`);
    return DEV_HOSTNAMES.has(url.hostname) && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}

// compiler/utils/dev-markdown.ts
import { readFile as readFile5 } from "node:fs/promises";
async function devMarkdown(area, pathname, origin, signal) {
  let path = pathname.replace(/\.md$/, "") || "/";
  const upstreamSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(1e4)]) : AbortSignal.timeout(1e4);
  const metadata = await fetch(`http://127.0.0.1:${area.port}${joinMountPath(area.mount, "notra-pages.json")}`, { signal: upstreamSignal });
  if (!metadata.ok) {
    await metadata.body?.cancel();
    throw new Error("Unable to load local page metadata");
  }
  const pages = await metadata.json();
  const entry = pages.entries.find((item) => item.path === path);
  if (!entry) {
    path = path.replace(/\/index$/, "") || "/";
  }
  if (!entry && path !== pages.indexPath.replace(/\/$/, "") && path !== "/") {
    const asset = await fetch(`http://127.0.0.1:${area.port}${pathname}`, {
      signal: upstreamSignal
    });
    if (asset.ok && !asset.headers.get("content-type")?.startsWith("text/html")) {
      return asset;
    }
    await asset.body?.cancel();
    return new Response(`# Page not found
`, {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  const response = await fetch(`http://127.0.0.1:${area.port}${path}`, {
    signal: upstreamSignal
  });
  if (!response.ok) {
    await response.body?.cancel();
    return new Response(`# Page not found
`, {
      status: response.status,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    });
  }
  const html = await response.text();
  const url = new URL(path, origin).toString();
  const markdown = entry ? entryMarkdown(entry, url, htmlToMarkdown(html, url)) : indexMarkdown(pages, origin);
  const params = JSON.parse(await readFile5(area.paramsPath, {
    encoding: "utf8",
    signal: upstreamSignal
  }));
  const instructions = instructionsSection(normalizeAgentInstructions(params.config.markdown?.instructions));
  return new Response(instructions ? `${markdown}
${instructions}
` : markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}

// compiler/dev-server.ts
function retargetHeadScripts(scripts, from, to) {
  const prefix = from === "/" ? "/" : `${from}/`;
  return scripts.map((script) => script.kind === "external" && script.src.startsWith(prefix) ? { ...script, src: joinMountPath(to, script.src.slice(prefix.length)) } : script);
}
function paramsForArea(params, area) {
  return {
    ...params,
    area: area.area,
    mount: area.mount,
    headScripts: retargetHeadScripts(params.headScripts, params.mount, area.mount)
  };
}
async function findFreePort(from) {
  for (let port = from;port < from + DEV_PORT_SEARCH_RANGE && port <= 65535; port++) {
    const free = await new Promise((resolve) => {
      const probe = createNetServer();
      probe.once("error", () => resolve(false));
      probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
    });
    if (free) {
      return port;
    }
  }
  throw new Error(`No free port between ${from} and ${from + DEV_PORT_SEARCH_RANGE}`);
}
async function findUnusedPort(from) {
  for (let port = from;port < from + DEV_PORT_SEARCH_RANGE && port <= 65535; port++) {
    const answered = await new Promise((resolve) => {
      const socket = connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => resolve(false));
    });
    if (!answered) {
      return port;
    }
  }
  throw new Error(`No free port between ${from} and ${from + DEV_PORT_SEARCH_RANGE}`);
}
async function startAstroDev(toolchainRoot, area) {
  const root = join8(dirname4(area.paramsPath), "astro", area.area);
  area.hmrToken ??= randomBytes(18).toString("base64url");
  area.hmrGeneration = (area.hmrGeneration ?? 0) + 1;
  mkdirSync(root, { recursive: true });
  cpSync(join8(toolchainRoot, "src"), join8(root, "src"), { recursive: true });
  const modules = join8(dirname4(area.paramsPath), "node_modules");
  if (!existsSync(modules)) {
    let dependencyRoot = toolchainRoot;
    while (!existsSync(join8(dependencyRoot, "node_modules"))) {
      const parent = dirname4(dependencyRoot);
      if (parent === dependencyRoot) {
        throw new Error("Notra Sites runtime dependencies are missing");
      }
      dependencyRoot = parent;
    }
    symlinkSync(join8(dependencyRoot, "node_modules"), modules, "junction");
  }
  const sourceWatcher = watch(join8(toolchainRoot, "src"), { recursive: true }, (_event, filename) => {
    if (!filename) {
      return;
    }
    const source = join8(toolchainRoot, "src", filename);
    const destination = join8(root, "src", filename);
    try {
      if (existsSync(source)) {
        cpSync(source, destination, { recursive: true });
      } else {
        rmSync(destination, { recursive: true, force: true });
      }
    } catch (error) {
      process.stderr.write(`${String(error)}
`);
    }
  });
  let running;
  try {
    const child = spawn2(process.execPath, [
      astroBin(toolchainRoot),
      "dev",
      "--ignore-lock",
      "--root",
      root,
      "--config",
      relative2(root, join8(toolchainRoot, "astro.config.mjs")),
      "--host",
      "127.0.0.1",
      "--port",
      String(area.port)
    ], {
      cwd: toolchainRoot,
      env: {
        ...process.env,
        NOTRA_BUILD_PARAMS: area.paramsPath,
        NOTRA_DEV_ROOT: root,
        NOTRA_DEV_MODULES: modules,
        NOTRA_DEV_HMR_TOKEN: `${area.hmrToken}.${area.hmrGeneration}`,
        NOTRA_DEV_DOCUMENT_TOKEN: area.documentToken,
        NOTRA_DEV_HMR_EVENT: DEV_HMR_GENERATION_EVENT,
        NOTRA_DEV_ERRORS_PATH: DEV_ERRORS_PATH,
        ASTRO_TELEMETRY_DISABLED: "1",
        ASTRO_DISABLE_UPDATE_CHECK: "true"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    running = { area, child };
    child.once("close", () => sourceWatcher.close());
    child.once("error", () => sourceWatcher.close());
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(null), DEV_READY_TIMEOUT_MS);
      let ready = false;
      const filterOutput = createAstroLogFilter();
      const watch = (stream) => {
        let tail = "";
        stream.on("data", (chunk) => {
          const text = chunk.toString();
          const filtered = filterOutput(text);
          if (filtered.trim()) {
            process.stderr.write(filtered);
          }
          if (ready) {
            return;
          }
          tail = (tail + text).slice(-ASTRO_READY_SCAN_CHARS);
          const match = ASTRO_READY_URL.exec(tail);
          if (match?.[1]) {
            ready = true;
            clearTimeout(timer);
            resolve(Number(match[1]));
          }
        });
      };
      watch(child.stdout);
      watch(child.stderr);
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("exit", () => {
        clearTimeout(timer);
        resolve(null);
      });
    });
    if (port === null) {
      sourceWatcher.close();
      await stopAstroDev(running);
      return null;
    }
    area.port = port;
    return running;
  } catch (error) {
    sourceWatcher.close();
    if (running) {
      await stopAstroDev(running);
    }
    throw error;
  }
}
async function stopAstroDev(running) {
  const { child } = running;
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, DEV_STOP_TIMEOUT_MS);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill("SIGTERM");
  });
}
function isDocumentRequest(incoming) {
  if (incoming.method !== "GET") {
    return false;
  }
  const destination = incoming.headers["sec-fetch-dest"];
  return destination ? destination === "document" : (incoming.headers.accept ?? "").includes("text/html");
}
function pathnameOf(incoming) {
  try {
    return decodeURIComponent(new URL(incoming.url ?? "/", "http://localhost").pathname);
  } catch {
    return null;
  }
}
function proxyUpgrade(incoming, socket, head, target) {
  const upstream = connect(target.port, "127.0.0.1", () => {
    const headers = Object.entries(incoming.headers).flatMap(([name, value]) => (Array.isArray(value) ? value : [value ?? ""]).map((item) => `${name}: ${item}`));
    upstream.write(`${incoming.method} ${incoming.url} HTTP/${incoming.httpVersion}\r
${headers.join(`\r
`)}\r
\r
`);
    upstream.write(head);
    upstream.pipe(socket).pipe(upstream);
  });
  upstream.on("error", () => socket.destroy());
  upstream.on("close", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  socket.on("close", () => upstream.destroy());
}
function startDevProxy(port, mounts, areas, waitForReady, siteErrors = () => []) {
  const [fallback] = areas;
  const targetFor = (pathname) => {
    const owner = resolveAreaForPath(mounts, pathname);
    return areas.find((area) => area.area === owner?.area) ?? fallback;
  };
  const server = createServer(async (incoming, outgoing) => {
    if (!isLocalDevHost(incoming.headers.host)) {
      outgoing.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      outgoing.end("Local previews require a loopback host.");
      return;
    }
    try {
      await waitForReady();
    } catch (error) {
      process.stderr.write(`${String(error)}
`);
      outgoing.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      outgoing.end("The dev server is restarting, reload in a moment.");
      return;
    }
    if (outgoing.destroyed) {
      return;
    }
    const pathname = pathnameOf(incoming);
    if (pathname === null) {
      outgoing.writeHead(400);
      outgoing.end();
      return;
    }
    if (pathname === DEV_ERRORS_PATH) {
      outgoing.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      });
      outgoing.end(JSON.stringify({ count: siteErrors().length }));
      return;
    }
    const errors = siteErrors();
    if (errors.length > 0 && isDocumentRequest(incoming)) {
      outgoing.writeHead(500, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      outgoing.end(devErrorPage(errors));
      return;
    }
    if (areas.some((area) => pathname.replace(/\/+$/, "") === joinMountPath(area.mount, AREA_PAGES_FILE))) {
      outgoing.writeHead(404);
      outgoing.end();
      return;
    }
    if (fallback && pathname === "/" && !resolveAreaForPath(mounts, pathname)) {
      outgoing.writeHead(302, { location: fallback.mount });
      outgoing.end();
      return;
    }
    const target = targetFor(pathname);
    if (!target) {
      outgoing.writeHead(502);
      outgoing.end();
      return;
    }
    if ((incoming.method === "GET" || incoming.method === "HEAD") && pathname.endsWith(".md")) {
      const controller = new AbortController;
      const disconnected = () => controller.abort();
      outgoing.once("close", disconnected);
      incoming.once("aborted", disconnected);
      incoming.once("error", disconnected);
      try {
        const response = await devMarkdown(target, pathname, `http://localhost:${port}`, controller.signal);
        if (outgoing.destroyed || incoming.method === "HEAD") {
          await response.body?.cancel();
        }
        if (outgoing.destroyed) {
          return;
        }
        const body = incoming.method === "HEAD" ? undefined : Buffer.from(await response.arrayBuffer());
        if (outgoing.destroyed) {
          return;
        }
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(body);
      } catch (error) {
        if (outgoing.destroyed || controller.signal.aborted) {
          return;
        }
        process.stderr.write(`${String(error)}
`);
        if (outgoing.headersSent) {
          outgoing.destroy();
          return;
        }
        outgoing.writeHead(502, {
          "Content-Type": "text/plain; charset=utf-8"
        });
        outgoing.end("The dev server is restarting, reload in a moment.");
      } finally {
        outgoing.removeListener("close", disconnected);
        incoming.removeListener("aborted", disconnected);
        incoming.removeListener("error", disconnected);
      }
      return;
    }
    const retryable = (incoming.method === "GET" || incoming.method === "HEAD") && incoming.headers["transfer-encoding"] === undefined && (incoming.headers["content-length"] === undefined || incoming.headers["content-length"] === "0");
    const controller = new AbortController;
    let upstream;
    let attempts = 0;
    const disconnected = () => {
      controller.abort();
      upstream?.destroy();
    };
    outgoing.once("close", disconnected);
    incoming.once("aborted", disconnected);
    incoming.once("error", disconnected);
    const connectUpstream = () => {
      if (outgoing.destroyed || controller.signal.aborted) {
        return;
      }
      attempts += 1;
      const current = request({
        host: "127.0.0.1",
        port: target.port,
        method: incoming.method,
        path: incoming.url,
        headers: incoming.headers
      }, (response) => {
        if (outgoing.destroyed || controller.signal.aborted) {
          response.destroy();
          return;
        }
        outgoing.writeHead(response.statusCode ?? 502, response.headers);
        pipeline(response, outgoing, (error) => {
          if (error) {
            current.destroy();
          }
        });
      });
      upstream = current;
      current.on("error", async (error) => {
        if (outgoing.destroyed || controller.signal.aborted) {
          return;
        }
        if (outgoing.headersSent) {
          outgoing.destroy();
          return;
        }
        incoming.unpipe(current);
        current.destroy();
        if (retryable && attempts < DEV_PROXY_MAX_ATTEMPTS && DEV_PROXY_RETRY_ERRORS.has(error.code ?? "")) {
          try {
            await delay(DEV_PROXY_RETRY_DELAY_MS, undefined, {
              signal: controller.signal
            });
            if (outgoing.destroyed || controller.signal.aborted) {
              return;
            }
            await waitForReady();
            connectUpstream();
            return;
          } catch {
            if (outgoing.destroyed || controller.signal.aborted) {
              return;
            }
          }
        }
        outgoing.writeHead(502, { "content-type": "text/plain" });
        outgoing.end(`The ${target.area} dev server is restarting, reload in a moment.`);
      });
      if (attempts === 1) {
        incoming.pipe(current);
      } else {
        current.end();
      }
    };
    connectUpstream();
  });
  server.on("upgrade", async (incoming, socket, head) => {
    if (!isLocalDevHost(incoming.headers.host)) {
      socket.destroy();
      return;
    }
    const disconnected = () => socket.destroy();
    socket.once("error", disconnected);
    socket.once("end", disconnected);
    try {
      await waitForReady();
    } catch {
      socket.destroy();
      return;
    } finally {
      socket.removeListener("error", disconnected);
      socket.removeListener("end", disconnected);
    }
    if (socket.destroyed) {
      return;
    }
    const pathname = pathnameOf(incoming);
    let target = pathname === null ? undefined : targetFor(pathname);
    if (!target) {
      socket.destroy();
      return;
    }
    delete incoming.headers["x-notra-hmr-reload"];
    if (incoming.headers["sec-websocket-protocol"] === "vite-hmr") {
      const url = new URL(incoming.url ?? "/", "http://localhost");
      const [token = "", revision, extra] = (url.searchParams.get("token") ?? "").split(".");
      const generation = Number(revision);
      const supplied = Buffer.from(token);
      const owner = areas.find((area) => {
        if (!area.hmrToken) {
          return false;
        }
        const expected = Buffer.from(area.hmrToken);
        return expected.length === supplied.length && timingSafeEqual(expected, supplied);
      });
      if (!owner?.hmrGeneration || extra !== undefined || !Number.isSafeInteger(generation) || generation < 1 || String(generation) !== revision || generation > owner.hmrGeneration) {
        socket.destroy();
        return;
      }
      target = owner;
      if (generation !== owner.hmrGeneration) {
        incoming.headers["x-notra-hmr-reload"] = "1";
        url.searchParams.set("token", `${owner.hmrToken}.${owner.hmrGeneration}`);
        incoming.url = `${url.pathname}${url.search}`;
      }
    }
    proxyUpgrade(incoming, socket, head, target);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

// compiler/utils/dev-areas.ts
async function startDevAreas(toolchainRoot, areas) {
  const results = await Promise.allSettled(areas.map((area) => startAstroDev(toolchainRoot, area)));
  const running = results.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
  const failure = results.find((result) => result.status === "rejected");
  if (failure || running.length !== areas.length) {
    await Promise.all(running.map(stopAstroDev));
    if (failure) {
      throw failure.reason;
    }
    return null;
  }
  return running;
}

// compiler/utils/dev-generated-assets.ts
import { rm as rm4 } from "node:fs/promises";
import { join as join9, relative as relative3, sep as sep2 } from "node:path";
async function cleanDevGeneratedAssets(workDir, publicFiles, customScripts) {
  const publicDir = join9(workDir, "site", "public");
  const retained = new Set([
    ...publicFiles.map((path) => join9(publicDir, path)),
    ...customScripts.map((name) => join9(publicDir, SITE_ASSETS_DIR, name))
  ]);
  const generated = await listFiles(join9(publicDir, "_notra")).catch((error) => {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  });
  await Promise.all(generated.filter((path) => {
    if (retained.has(path)) {
      return false;
    }
    const name = relative3(publicDir, path).split(sep2).join("/");
    return name.startsWith(`${SITE_ASSETS_DIR}/`) && /^custom-[A-Za-z0-9_-]+\.[a-f0-9]{10}\.js$/.test(name.slice(SITE_ASSETS_DIR.length + 1)) || name.startsWith(`${SITE_ASSETS_DIR}/fonts/`) && /^[a-f0-9]{64}\//.test(name.slice(`${SITE_ASSETS_DIR}/fonts/`.length)) || SITE_AREAS.some((area) => name.startsWith(`${OG_IMAGES_DIR}/${area}/`)) && name.endsWith(".png");
  }).map((path) => rm4(path, { force: true })));
}

// compiler/utils/dev-refresh.ts
function createDevRefresh(options) {
  let revision = 0;
  let pending = false;
  let closed = false;
  let active = false;
  let published = "";
  let delayMs = 0;
  let running;
  let stopping;
  let wake;
  const stopAstro = async () => {
    if (!active) {
      return;
    }
    const code = await options.runAstro("stop");
    if (code !== 0) {
      throw new Error(`Astro stop failed (${code})`);
    }
    active = false;
  };
  const refreshOnce = async () => {
    const current = revision;
    if (delayMs > 0) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, delayMs);
        wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      wake = undefined;
    }
    if (closed || current !== revision) {
      return;
    }
    const prepared = await options.prepare();
    if (closed || current !== revision) {
      return;
    }
    const config = prepared.validation.config;
    if (!(prepared.validation.ok && config)) {
      options.printDiagnostics([
        ...prepared.collectDiagnostics,
        ...prepared.validation.diagnostics
      ]);
      return;
    }
    const ogImages = await options.writeOgImages({
      workDir: options.params.workDir,
      config,
      entries: prepared.validation.entries,
      publicFiles: prepared.publicFiles,
      includeDrafts: options.params.includeDrafts,
      publicOrigin: options.params.publicOrigin,
      areas: listMountedAreas(options.params.mounts).map(({ area }) => area)
    });
    if (closed || current !== revision) {
      return;
    }
    const consentDiagnostics = consentScriptDiagnostics(config, prepared.customScripts);
    options.printDiagnostics([
      ...prepared.collectDiagnostics,
      ...prepared.validation.diagnostics,
      ...ogImages.diagnostics,
      ...consentDiagnostics
    ]);
    if (hasErrors(consentDiagnostics)) {
      return;
    }
    const params = {
      ...options.params,
      config,
      fontStylesheet: prepared.fontStylesheet,
      hasReactComponents: hasReactComponents(prepared.validation.outputs),
      publicFiles: [
        ...new Set([
          ...prepared.publicFiles,
          ...Object.values(ogImages.manifest)
        ])
      ].sort(),
      headScripts: siteHeadScripts(config, options.params.mount, prepared.customScripts, false),
      consent: siteConsent(config, prepared.customScripts, false, true)
    };
    const snapshot = JSON.stringify(params);
    if (snapshot === published && active) {
      await cleanDevGeneratedAssets(params.workDir, params.publicFiles, prepared.customScripts.map((script) => script.fileName));
      return;
    }
    await stopAstro();
    if (closed || current !== revision) {
      return;
    }
    const committed = await options.publish(params, () => !closed && current === revision);
    if (!committed) {
      return;
    }
    published = snapshot;
    if (closed || current !== revision) {
      return;
    }
    active = true;
    const code = await options.runAstro("dev");
    if (code !== 0) {
      await stopAstro();
      throw new Error(`Astro dev failed (${code})`);
    }
    if (!closed && current === revision) {
      await cleanDevGeneratedAssets(params.workDir, params.publicFiles, prepared.customScripts.map((script) => script.fileName));
    }
  };
  const drain = async () => {
    try {
      while (pending) {
        pending = false;
        if (closed) {
          break;
        }
        try {
          await refreshOnce();
        } catch (error) {
          if (!pending || closed) {
            throw error;
          }
          options.reportError(error);
        }
      }
      return active;
    } finally {
      running = undefined;
    }
  };
  return {
    refresh(debounceMs = 0) {
      if (closed) {
        return Promise.resolve(false);
      }
      revision += 1;
      pending = true;
      delayMs = debounceMs;
      wake?.();
      running ??= Promise.resolve().then(drain);
      return running;
    },
    shutdown() {
      closed = true;
      revision += 1;
      pending = false;
      wake?.();
      stopping ??= (async () => {
        await running?.catch(() => {
          return;
        });
        await stopAstro();
      })();
      return stopping;
    }
  };
}

// compiler/utils/local-options.ts
import { basename } from "node:path";

// ../../packages/sites-core/src/utils/default-config.ts
function createDefaultSiteConfig(name) {
  return siteConfigSchema.parse({
    name,
    blog: siteBlogSchema.parse({}),
    changelog: siteChangelogSchema.parse({})
  });
}

// compiler/utils/local-options.ts
function localDefaultConfig(siteRoot, target) {
  return target?.defaultConfig ?? createDefaultSiteConfig(basename(siteRoot).trim().slice(0, siteConfigSchema.shape.name.maxLength ?? 80).trim() || "Local site");
}

// compiler/cli.ts
var TOOLCHAIN_ROOT = fileURLToPath(new URL("..", import.meta.url));
function formatDiagnostic(diagnostic) {
  const location = diagnostic.file ? `${diagnostic.file}${diagnostic.line ? `:${diagnostic.line}${diagnostic.column ? `:${diagnostic.column}` : ""}` : ""}` : "site";
  return `${diagnostic.severity === "error" ? "✖" : "⚠"} ${location}  ${diagnostic.message}`;
}
function printDiagnostics(diagnostics) {
  for (const diagnostic of diagnostics) {
    process.stderr.write(`${formatDiagnostic(diagnostic)}
`);
  }
}
async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${USAGE}
`);
    return;
  }
  const { values } = parseArgs({
    args: rest,
    options: {
      source: { type: "string", default: "." },
      target: { type: "string" },
      out: { type: "string" },
      area: { type: "string" },
      port: { type: "string", default: "4321" },
      json: { type: "boolean", default: false },
      "result-file": { type: "string" },
      help: { type: "boolean", short: "h" }
    }
  });
  if (values.help) {
    process.stdout.write(`${USAGE}
`);
    return;
  }
  const siteRoot = resolve2(values.source ?? ".");
  if (command === "validate") {
    const target = values.target ? await readBuildTarget(values.target) : undefined;
    if (target) {
      normalizeSiteMounts(target.mounts);
    }
    const { collected, files } = await readSiteFiles(siteRoot);
    const result = validateSite({
      files,
      defaultConfig: localDefaultConfig(siteRoot, target)
    });
    const diagnostics = [...collected.diagnostics, ...result.diagnostics];
    const ok = !hasErrors(diagnostics);
    if (values.json) {
      process.stdout.write(`${JSON.stringify({ ok, diagnostics, entries: result.entries }, null, 2)}
`);
    } else {
      printDiagnostics(diagnostics);
      process.stderr.write(ok ? `✔ ${result.entries.length} entries, ${files.size} files look good
` : `Validation failed
`);
    }
    process.exit(ok ? 0 : 1);
  }
  if (command === "build") {
    if (!(values.target && values.out)) {
      throw new Error("build needs --target and --out");
    }
    const target = await readBuildTarget(values.target);
    const result = await buildSite({
      toolchainRoot: TOOLCHAIN_ROOT,
      siteRoot,
      target,
      outDir: resolve2(values.out)
    });
    if (values["result-file"]) {
      await writeFile3(values["result-file"], JSON.stringify(result));
    }
    if (values.json) {
      process.stdout.write(`${JSON.stringify(result)}
`);
    } else {
      printDiagnostics(result.diagnostics);
      process.stderr.write(result.ok ? `✔ Built ${result.areas.map((area) => `${area.area} at ${area.mount} (${area.durationMs} ms)`).join(", ")}: ${result.fileCount} files, ${(result.totalBytes / 1024).toFixed(0)} KB
` : `Build failed
`);
    }
    process.exit(result.ok ? 0 : 1);
  }
  if (command === "dev") {
    const target = values.target ? await readBuildTarget(values.target) : undefined;
    const mounts = normalizeSiteMounts(target?.mounts ?? { blog: "/blog", changelog: "/changelog" });
    const defaultConfig = localDefaultConfig(siteRoot, target);
    const requestedPort = Number(values.port ?? "4321");
    if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65533) {
      throw new Error("--port must be an integer between 1 and 65533");
    }
    const port = await findUnusedPort(requestedPort);
    if (port !== requestedPort) {
      process.stderr.write(`Port ${requestedPort} is in use, using ${port} instead.
`);
    }
    if (values.area && values.area !== "blog" && values.area !== "changelog") {
      throw new Error("--area must be blog or changelog");
    }
    const workDir = await realpath(await mkdtemp2(join10(tmpdir(), "notra-sites-dev-")));
    const mounted = listMountedAreas(mounts);
    const areas = [];
    let nextPort = port + 1;
    try {
      for (const entry of mounted) {
        const areaPort = await findFreePort(nextPort);
        nextPort = areaPort + 1;
        areas.push({
          ...entry,
          port: areaPort,
          paramsPath: join10(workDir, `params.dev.${entry.area}.json`)
        });
      }
    } catch (error) {
      await rm5(workDir, { recursive: true, force: true });
      throw error;
    }
    const selected = areas.find((entry) => entry.area === values.area) ?? areas[0];
    if (!selected) {
      process.exit(1);
    }
    const ordered = [selected, ...areas.filter((area) => area !== selected)];
    const documentSession = randomBytes2(18).toString("base64url");
    let documentGeneration = 0;
    let running = [];
    let siteErrors = [];
    const stopAreas = async () => {
      const stopping = running;
      running = [];
      await Promise.all(stopping.map(stopAstroDev));
    };
    const refresh = createDevRefresh({
      params: {
        area: selected.area,
        mount: selected.mount,
        publicOrigin: `http://localhost:${port}`,
        siteId: "local",
        deploymentId: "local",
        noindex: true,
        includeDrafts: true,
        branding: target?.branding ?? true,
        workDir,
        mounts
      },
      prepare: () => prepareSite({
        siteRoot,
        workDir,
        incremental: true,
        defaultConfig
      }),
      writeOgImages,
      printDiagnostics: (diagnostics) => {
        siteErrors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
        printDiagnostics(diagnostics);
      },
      reportError: (error) => process.stderr.write(`${String(error)}
`),
      publish: async (params, isCurrent) => {
        for (const area of areas) {
          const temporaryPath = `${area.paramsPath}.tmp`;
          await writeBuildParams(temporaryPath, paramsForArea(params, area));
          if (!isCurrent()) {
            return false;
          }
          renameSync(temporaryPath, area.paramsPath);
        }
        return true;
      },
      runAstro: async (astroCommand) => {
        await stopAreas();
        if (astroCommand === "stop") {
          return 0;
        }
        documentGeneration += 1;
        for (const area of areas) {
          area.documentToken = `${documentSession}.${documentGeneration}`;
        }
        running = await startDevAreas(TOOLCHAIN_ROOT, areas) ?? [];
        return running.length === areas.length ? 0 : 1;
      }
    });
    let watchedRefresh;
    let proxy;
    let watcher;
    let stopping;
    const stop = () => {
      stopping ??= (async () => {
        watcher?.close();
        proxy?.close();
        await refresh.shutdown();
        await rm5(workDir, { recursive: true, force: true });
      })();
      return stopping;
    };
    let interrupted = false;
    const onSignal = () => {
      interrupted = true;
      stop().then(() => process.exit(0)).catch((error) => {
        process.stderr.write(`${String(error)}
`);
        process.exit(1);
      });
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
    process.on("SIGHUP", onSignal);
    try {
      watcher = watch2(siteRoot, { recursive: true }, () => {
        const requested = refresh.refresh(150);
        if (requested !== watchedRefresh) {
          watchedRefresh = requested;
          requested.catch((error) => process.stderr.write(`${String(error)}
`));
        }
      });
      proxy = await startDevProxy(port, mounts, ordered, async () => {
        await watchedRefresh;
      }, () => siteErrors);
      if (interrupted) {
        proxy.close();
        await stop();
        process.exit(0);
      }
      watchedRefresh = refresh.refresh();
      const started = await watchedRefresh;
      if (interrupted) {
        await stop();
        process.exit(0);
      }
      const urls = areas.map((area) => `${area.area} at http://localhost:${port}${area.mount}`).join(" and ");
      process.stderr.write(started ? `Previewing ${urls}
` : `Fix the errors above to preview ${urls}. Waiting for changes...
`);
      await new Promise(() => {
        return;
      });
    } catch (error) {
      await stop();
      throw error;
    }
  }
  process.stderr.write(`${USAGE}
`);
  process.exit(command ? 1 : 0);
}
main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}
`);
  process.exit(1);
});
