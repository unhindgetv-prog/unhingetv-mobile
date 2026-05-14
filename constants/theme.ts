// ─── UnhingeTV Brand Theme ────────────────────────────────────────────────────

export const Colors = {
  // Brand
  red:        "#CC0000",
  redDark:    "#880000",
  redMuted:   "#CC000020",

  // Background / surface
  black:      "#000000",
  dark:       "#0A0A0A",
  card:       "#111111",
  cardBorder: "#1F1F1F",
  muted:      "#1A1A1A",

  // Text
  white:      "#FFFFFF",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.30)",
  textFaint:  "rgba(255,255,255,0.15)",

  // Accents
  gold:       "#FFD700",
  green:      "#22C55E",
  orange:     "#F97316",
  blue:       "#3B82F6",

  // Semantic aliases (used by screens that prefer role-based names)
  background: "#000000",
  brandRed:   "#CC0000",
  border:     "#1F1F1F",
  surface:    "#111111",
} as const;

export const FontSizes = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  26,
  hero: 36,
} as const;

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 999,
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
} as const;
