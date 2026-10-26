import { existsSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const paramsPath = process.env.NOTRA_BUILD_PARAMS;
if (!paramsPath) {
  throw new Error(
    "NOTRA_BUILD_PARAMS is not set; run builds through `notra-sites build`"
  );
}
const params = JSON.parse(readFileSync(paramsPath, "utf8"));
const ASTRO_VIRTUAL_MODULE = /\.astro\?astro&/;
const srcDir = process.env.NOTRA_DEV_ROOT
  ? resolve(process.env.NOTRA_DEV_ROOT, "src")
  : fileURLToPath(new URL("src", import.meta.url));
const workDir = resolve(params.workDir);
const siteDir = resolve(workDir, "site");
const codeblocks = params.config.styling?.codeblocks ?? "system";
function shikiThemesFor(setting) {
  if (setting === "system") {
    return { light: "github-light", dark: "github-dark" };
  }
  if (setting === "dark") {
    return { light: "github-dark", dark: "github-dark" };
  }
  return typeof setting === "string"
    ? { light: setting, dark: setting }
    : setting;
}
const shikiThemes = shikiThemesFor(codeblocks);
const consent = params.consent;
async function consentIntegrations() {
  if (!consent) {
    return [];
  }
  const { default: c15t, hosted, offline } = await import("@c15t/astro");
  const assets = `${params.mount.replace(/\/$/, "")}/_notra/assets`;
  return [
    c15t({
      ...consent.options,
      mode: consent.backendURL
        ? hosted({ backendURL: consent.backendURL })
        : offline(),
      scripts: consent.scripts.map((script) => ({
        id: `notra-script-${script.fileName}`,
        src: `${assets}/${script.fileName}`,
        category: script.category,
        defer: true,
      })),
      ...(consent.analytics && {
        clientEntrypoint: resolve(srcDir, "c15t.client.ts"),
      }),
    }),
  ];
}
const smartQuotes = params.config.styling?.smartQuotes !== false;

const markdownFeatures = {
  name: "notra-markdown-features",
  hooks: {
    "astro:config:setup": ({ config }) => {
      // Satteri reads its features lazily, so this covers .md and .mdx.
      config.markdown.processor.options.features.smartPunctuation = smartQuotes;
    },
  },
};

export default defineConfig({
  site: params.publicOrigin,
  srcDir,
  base: params.mount,
  outDir: resolve(workDir, "out", params.area),
  publicDir: resolve(siteDir, "public"),
  cacheDir: resolve(workDir, "cache", params.area),
  trailingSlash: "ignore",
  build: {
    format: "directory",
    assets: "_notra/assets",
    inlineStylesheets: "auto",
  },
  devToolbar: { enabled: false },
  telemetry: false,
  integrations: [
    markdownFeatures,
    mdx({ shikiConfig: { themes: shikiThemes, wrap: false } }),
    ...(params.hasReactComponents || consent
      ? [(await import("@astrojs/react")).default()]
      : []),
    ...(await consentIntegrations()),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      ...(process.env.NOTRA_DEV_ROOT
        ? [
            {
              name: "notra-dev-external-astro",
              enforce: "pre",
              resolveId(id) {
                const file = id.split("?")[0];
                const outsideRoot =
                  ASTRO_VIRTUAL_MODULE.test(id) &&
                  !file.startsWith("/@fs/") &&
                  !file.startsWith(realpathSync(process.env.NOTRA_DEV_ROOT)) &&
                  existsSync(file);
                return outsideRoot ? `/@fs${id}` : null;
              },
            },
          ]
        : []),
      ...(process.env.NOTRA_DEV_HMR_TOKEN
        ? [
            {
              name: "notra-dev-hmr",
              configResolved(config) {
                config.webSocketToken = process.env.NOTRA_DEV_HMR_TOKEN;
              },
              configureServer(server) {
                server.ws.on("connection", (socket, request) => {
                  if (request.headers["x-notra-hmr-reload"] === "1") {
                    socket.send(JSON.stringify({ type: "full-reload" }));
                  }
                });
                const documentToken = process.env.NOTRA_DEV_DOCUMENT_TOKEN;
                const event = process.env.NOTRA_DEV_HMR_EVENT;
                if (documentToken && event) {
                  const [session, revision] = documentToken.split(".");
                  const current = Number(revision);
                  server.ws.on(event, (renderedToken, client) => {
                    if (typeof renderedToken !== "string") {
                      return;
                    }
                    const [renderedSession, renderedRevision, extra] =
                      renderedToken.split(".");
                    const rendered = Number(renderedRevision);
                    if (
                      renderedSession === session &&
                      extra === undefined &&
                      Number.isSafeInteger(rendered) &&
                      rendered >= 1 &&
                      String(rendered) === renderedRevision &&
                      rendered < current
                    ) {
                      client.send({ type: "full-reload" });
                    }
                  });
                }
              },
            },
          ]
        : []),
    ],
    ssr: { noExternal: ["@astrojs/react"] },
    define: {
      __NOTRA_CONSENT_ANALYTICS__: JSON.stringify(consent?.analytics ?? {}),
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        },
      },
    },
    resolve: {
      alias: {
        "@site": siteDir,
        "@notra/builtins/SiteAreas.astro": resolve(
          srcDir,
          "components/SiteAreas.astro"
        ),
        "@notra/builtins/ThemeToggle.astro": resolve(
          srcDir,
          "components/ThemeToggle.astro"
        ),
        "@notra/builtins": resolve(srcDir, "builtins"),
        "@notra/custom-css": resolve(workDir, "custom.css"),
        "@notra/consent-devtools": resolve(
          srcDir,
          consent?.devTools
            ? "components/ConsentDevTools.astro"
            : "components/ConsentDisabled.astro"
        ),
        "@notra/consent": resolve(
          srcDir,
          consent
            ? "components/Consent.astro"
            : "components/ConsentDisabled.astro"
        ),
      },
    },
    server: {
      fs: {
        allow: [
          workDir,
          resolve("."),
          resolve("../../node_modules"),
          ...(process.env.NOTRA_DEV_MODULES
            ? [realpathSync(process.env.NOTRA_DEV_MODULES)]
            : []),
        ],
      },
    },
    logLevel: "warn",
  },
});
