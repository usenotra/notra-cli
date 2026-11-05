export interface AreaHeroProps {
  title: string;
  description?: string;
  /** Column the hero lines up with: the wide index grid (default) or the centered reading column. */
  width?: "index" | "reading";
}
