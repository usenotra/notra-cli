import { defineMiddleware } from "astro:middleware";

import { params } from "./lib/params";
import { rewritePublicAssetUrls } from "./utils/public-assets";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (
    !import.meta.env.DEV ||
    params.mount === "/" ||
    params.publicFiles.length === 0 ||
    !response.body ||
    !response.headers.get("content-type")?.startsWith("text/html")
  ) {
    return response;
  }
  const html = await response.clone().text();
  const rewritten = rewritePublicAssetUrls(
    html,
    params.mount,
    new Set(params.publicFiles)
  );
  if (rewritten === html) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  return new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
