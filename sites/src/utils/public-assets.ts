import {
  CSS_URL,
  SRCSET_ATTRIBUTE,
  URL_ATTRIBUTE,
} from "../constants/public-assets";
import { srcsetCandidates } from "./srcset";

function mountPublicUrl(
  url: string,
  mount: string,
  publicFiles: ReadonlySet<string>
): string {
  if (url.startsWith("//")) {
    return url;
  }
  const match = /^([^?#]*)(.*)$/.exec(url);
  const path = match?.[1] ?? url;
  let decoded = path;
  try {
    decoded = decodeURI(path);
  } catch {
    decoded = path;
  }
  return publicFiles.has(decoded) ? `${mount}${path}${match?.[2] ?? ""}` : url;
}

export function rewritePublicAssetUrls(
  html: string,
  mount: string,
  publicFiles: ReadonlySet<string>
): string {
  if (mount === "/" || publicFiles.size === 0) {
    return html;
  }
  const rewrite = (url: string) => mountPublicUrl(url, mount, publicFiles);
  return html
    .replace(
      URL_ATTRIBUTE,
      (_whole, name: string, quote: string, url: string) =>
        `${name}=${quote}${rewrite(url)}${quote}`
    )
    .replace(
      SRCSET_ATTRIBUTE,
      (
        _whole,
        name: string,
        double: string | undefined,
        single: string | undefined
      ) => {
        const quote = double === undefined ? "'" : '"';
        let value = double ?? single ?? "";
        // From the end, so earlier offsets stay valid.
        for (const { url, start, end } of srcsetCandidates(value).reverse()) {
          if (url.startsWith("/")) {
            value = value.slice(0, start) + rewrite(url) + value.slice(end);
          }
        }
        return `${name}=${quote}${value}${quote}`;
      }
    );
}

// Astro's dev server runs Vite at base "/", so absolute public-file URLs in
// stylesheets miss the mount that production builds add.
export function rewritePublicCssUrls(
  css: string,
  mount: string,
  publicFiles: ReadonlySet<string>
): string {
  if (mount === "/" || publicFiles.size === 0) {
    return css;
  }
  return css.replace(
    CSS_URL,
    (_whole, open: string, quote: string, url: string, close: string) =>
      `${open}${quote}${mountPublicUrl(url, mount, publicFiles)}${close}`
  );
}
