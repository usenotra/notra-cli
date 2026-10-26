import type { MarkdownHeading } from "astro";

export interface TocProps {
  headings: MarkdownHeading[];
  inline?: boolean;
  minItems?: number;
}

export interface TocItem {
  slug: string;
  text: string;
}

export interface TocSection extends TocItem {
  children: TocItem[];
}
