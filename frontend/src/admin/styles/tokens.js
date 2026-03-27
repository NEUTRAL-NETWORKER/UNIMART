export const tokens = {
  bg:            "#000500",
  bgElevated:    "#000a02",
  surface:       "#001a04",
  surfaceHover:  "#002506",
  border:        "#003d0c",
  borderLight:   "#005c12",

  primary:       "#00ff41",
  primaryHover:  "#00cc33",
  primaryActive: "#009922",
  primaryGlow:   "rgba(0, 255, 65, 0.18)",
  primaryShimmer:"rgba(0, 255, 65, 0.06)",

  accent:        "#00ff41",
  accentGlow:    "rgba(0, 255, 65, 0.14)",
  danger:        "#ff0033",
  dangerGlow:    "rgba(255, 0, 51, 0.18)",
  warning:       "#ffcc00",
  warningGlow:   "rgba(255, 204, 0, 0.14)",
  success:       "#00ff41",

  textPrimary:   "#00ff41",
  textSecondary: "#00b32c",
  textMuted:     "#005c12",
  textDisabled:  "#002506",

  fontDisplay:   "'JetBrains Mono', 'Courier New', monospace",
  fontBody:      "'JetBrains Mono', 'Courier New', monospace",
  fontMono:      "'JetBrains Mono', 'Courier New', monospace",

  radius: { sm: "2px", md: "4px", lg: "6px", xl: "8px", pill: "999px" },

  shadowSm:   "0 2px 8px rgba(0,255,65,0.1)",
  shadowMd:   "0 4px 20px rgba(0,255,65,0.15)",
  shadowLg:   "0 8px 40px rgba(0,255,65,0.2)",
  shadowGlow: (color) => `0 0 24px ${color}`,
};
