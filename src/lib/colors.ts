export const COLORS = {
  bg: "#071426",
  surface: "#0D1B2E",
  surfaceRaised: "#0F1535",
  primary: "#3FB7FF",
  primaryDark: "#2F80FF",
  accent: "#25D6A2",
  textPrimary: "#D8E0E8",
  textSecondary: "#7D8A9A",
  textMuted: "#A8B2C1",
  border: "rgba(255,255,255,0.08)",
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#F97316",
  greenDim: "rgba(34,197,94,0.12)",
  amberDim: "rgba(234,179,8,0.12)",
  dangerDim: "rgba(249,115,22,0.12)",
} as const;

export type ColorKey = keyof typeof COLORS;
