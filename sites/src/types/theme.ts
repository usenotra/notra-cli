export interface FontFace {
  family: string;
  weight?: number | string;
  style?: "normal" | "italic";
  source?: string;
  format?: string;
}

/** A font a role (body or heading text) renders in, at the weight it uses. */
export interface FontRole {
  role: "body" | "heading";
  family: string;
  weight: number;
  faces: FontFace[];
}

/** Overrides, in percent, that make a local font take the web font's space. */
export interface FontFallback {
  family: string;
  local: string;
  sizeAdjust: number;
  ascentOverride: number;
  descentOverride: number;
  lineGapOverride: number;
}

export interface DitherProps {
  class?: string;
}
