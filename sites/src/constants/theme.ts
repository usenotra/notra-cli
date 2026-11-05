export const BASE_LAYOUT_WIDTH_REM = 72;

export const LAYOUT_CONTAINERS_REM = {
  index: 64,
  post: 64,
  reading: 44,
} as const;

// Match --font-body-weight and --font-heading-weight in global.css.
export const FONT_DEFAULT_BODY_WEIGHT = 400;
export const FONT_DEFAULT_HEADING_WEIGHT = 500;

export const THEME_MODES = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "monitor" },
] as const;
