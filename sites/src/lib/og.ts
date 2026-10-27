import { readFileSync } from "node:fs";
import { join } from "node:path";

import { OG_MANIFEST_FILE } from "../constants/og";
import { assetUrl, params } from "./params";

function readManifest(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(join(params.workDir, OG_MANIFEST_FILE), "utf8")
    );
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

const manifest = readManifest();

function manifestImage(key: string): string | undefined {
  const path = manifest[key];
  return typeof path === "string" && path.startsWith("/")
    ? assetUrl(path)
    : undefined;
}

export function generatedImage(slug: string): string | undefined {
  return manifestImage(`${params.area}/${slug}`);
}

/** The generated share image of this section's index. */
export function generatedAreaImage(): string | undefined {
  return manifestImage(params.area);
}
