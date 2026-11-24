import type { SiteConfig } from "@notra/sites-core/types/site-config";

import {
  FONT_DEFAULT_BODY_WEIGHT,
  FONT_DEFAULT_HEADING_WEIGHT,
} from "../constants/theme";
import type { FontFace, FontRole } from "../types/theme";

type FontSpec = NonNullable<SiteConfig["fonts"]>;

function specFaces(spec: FontSpec | undefined): FontFace[] {
  const family = spec?.family;
  if (!family) {
    return [];
  }
  return [
    {
      family,
      weight: spec.weight,
      source: spec.source,
      format: spec.format,
    },
    ...(spec.faces ?? []).map((face) => ({
      family,
      weight: face.weight,
      style: face.style,
      source: face.source,
      format: face.format ?? spec.format,
    })),
  ];
}

export function declaredFonts(fonts: SiteConfig["fonts"]): FontFace[] {
  const all: FontFace[] = [];
  for (const face of [fonts, fonts?.body, fonts?.heading].flatMap(specFaces)) {
    if (
      !all.some(
        (font) =>
          font.family === face.family &&
          font.weight === face.weight &&
          font.style === face.style &&
          font.source === face.source &&
          font.format === face.format
      )
    ) {
      all.push(face);
    }
  }
  return all;
}

/** Body and heading fonts as the theme stacks them, with the weight each uses. */
export function fontRoles(fonts: SiteConfig["fonts"]): FontRole[] {
  const body = fonts?.body?.family ? fonts.body : fonts;
  // Without a heading font, headings use var(--font-body).
  const heading = [fonts?.heading, fonts, fonts?.body].find(
    (spec) => spec?.family
  );
  return [
    {
      role: "body" as const,
      spec: body,
      weight: fonts?.body?.weight ?? fonts?.weight ?? FONT_DEFAULT_BODY_WEIGHT,
    },
    {
      role: "heading" as const,
      spec: heading,
      weight: fonts?.heading?.weight ?? FONT_DEFAULT_HEADING_WEIGHT,
    },
  ].flatMap(({ role, spec, weight }) =>
    spec?.family
      ? [{ role, family: spec.family, weight, faces: specFaces(spec) }]
      : []
  );
}

/** Whether a face declared with `weight` (a number, "100 900", or none for every weight) serves `target`. */
export function coversWeight(
  weight: FontFace["weight"],
  target: number
): boolean {
  if (weight === undefined) {
    return true;
  }
  const [low = Number.NaN, high = low] = String(weight)
    .trim()
    .split(/\s+/)
    .map(Number);
  return Math.min(low, high) <= target && target <= Math.max(low, high);
}

function uprightFaces(role: FontRole): FontFace[] {
  return role.faces.filter(
    (face) => face.source && (face.style ?? "normal") === "normal"
  );
}

/** The file the browser downloads for a role's upright text, when one is declared. */
export function roleFace(role: FontRole): FontFace | undefined {
  return uprightFaces(role).find((face) =>
    coversWeight(face.weight, role.weight)
  );
}

/** The file whose metrics best describe a role, even when no face matches its weight exactly. */
export function metricsFace(role: FontRole): FontFace | undefined {
  return roleFace(role) ?? uprightFaces(role)[0];
}

export function isSiteFontPath(source: string): boolean {
  return !/^[a-z][a-z\d+.-]*:|^\/\//i.test(source);
}

/** Self-hosted woff2 files for the body and heading text, at most one per role. */
export function preloadFaces(fonts: SiteConfig["fonts"]): FontFace[] {
  const faces: FontFace[] = [];
  for (const role of fontRoles(fonts)) {
    const face = roleFace(role);
    if (
      face?.source &&
      isSiteFontPath(face.source) &&
      (face.format ?? "woff2") === "woff2" &&
      !faces.some((preloaded) => preloaded.source === face.source)
    ) {
      faces.push(face);
    }
  }
  return faces;
}
