import type { SitePageKind } from "./site-files";
export type JsonLdNode = Record<string, unknown>;

export interface ThemeColors {
  light: string;
  dark: string;
}

export interface SocialImage {
  url: string;
  large: boolean;
  alt?: string;
}

export interface ExtraMetaTag {
  key: "name" | "property";
  value: string;
  content: string;
}

export interface BaseLayoutProps {
  title: string;
  page: SitePageKind;
  description?: string;
  image?: string;
  imageAlt?: string;
  generatedImage?: string;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: Date;
  modifiedTime?: Date;
  tags?: string[];
  markdown?: string;
  jsonLd?: JsonLdNode[];
}

export interface FaqEntry {
  question: string;
  answer: string;
}
