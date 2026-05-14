// ─── UnhingeTV Brand Theme ────────────────────────────────────────────────────
// Canonical source: web/app/globals.css + web/tailwind.config.ts.
// Keep these tokens in sync with the website so mobile feels like the same brand.

export const Colors = {
  // Brand red system
  red:         "#CC0000",
  redBright:   "#FF0000",
  redDark:     "#880000",
  redAccent:   "#FF4444",     // 135deg gradient mid-stop
  redGlow:     "rgba(204,0,0,0.6)",
  redSubtle:   "rgba(204,0,0,0.15)",
  redBorder:   "rgba(204,0,0,0.35)",
  redMuted:    "#CC000020",

  // Surface system
  black:       "#000000",
  dark:        "#0A0A0A",     // canonical card surface (matches web --bg-card)
  card:        "#0A0A0A",     // alias
  muted:       "#111111",     // --bg-muted
  raised:      "#161616",     // --bg-raised
  surface:     "#111111",     // alias for legacy callers
  cardBorder:  "#1A1A1A",
  border:      "#1A1A1A",     // alias
  borderBright:"#2A2A2A",
  borderSubtle:"rgba(255,255,255,0.06)",

  // Text
  white:       "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.30)",
  textFaint:   "rgba(255,255,255,0.15)",

  // Semantic aliases (legacy callers — keep)
  background:  "#000000",
  brandRed:    "#CC0000",

  // Accents
  gold:        "#FFD700",
  green:       "#22C55E",
  orange:      "#F97316",
  blue:        "#3B82F6",
} as const;

// Gradient stop sets — pass directly to expo-linear-gradient's `colors` prop.
export const Gradients = {
  // Hero: top fade-in + bottom hard black (cinematic).
  hero: ["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.98)"] as const,
  // Card lift: transparent top → black bottom for text legibility on thumbnails.
  card: ["transparent", "rgba(0,0,0,0.85)"] as const,
  // Brand red diagonal — buttons + featured tiles.
  brand: ["#CC0000", "#FF4444"] as const,
  brandVertical: ["#CC0000", "#880000"] as const,
  // Dark luxe backdrop — auth screens.
  dark: ["#0A0A0A", "#000000"] as const,
  // Glass card backdrop — paywall + premium tiles.
  glassCard: ["rgba(20,0,0,0.6)", "rgba(10,10,10,0.85)"] as const,
  // Red vignette glow — subtle ambient on auth/paywall.
  redVignette: ["transparent", "rgba(100,0,0,0.25)"] as const,
} as const;

// Glow shadows — apply to TouchableOpacity / View via shadow{Color,Offset,Opacity,Radius} + elevation.
export const Glow = {
  redSm:    { shadowColor: "#CC0000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5,  shadowRadius: 8,  elevation: 4 },
  redMd:    { shadowColor: "#CC0000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.65, shadowRadius: 14, elevation: 6 },
  redLg:    { shadowColor: "#CC0000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8,  shadowRadius: 24, elevation: 10 },
  card:     { shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.8,  shadowRadius: 16, elevation: 6 },
  button:   { shadowColor: "#CC0000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5,  shadowRadius: 12, elevation: 8 },
} as const;

export const FontSizes = {
  xs:    11,
  sm:    13,
  md:    15,
  lg:    17,
  xl:    20,
  xxl:   26,
  hero:  36,
  // Display sizes (use with Fonts.bebas)
  display: 44,
  displayLg: 56,
  displayXl: 72,
} as const;

// Font family keys. Set after fonts load via useFonts(); fall back to system.
export const Fonts = {
  bebas:    "BebasNeue_400Regular",
  barlow:   "BarlowCondensed_700Bold",
  barlowSemi: "BarlowCondensed_600SemiBold",
  system:   undefined as string | undefined,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
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
