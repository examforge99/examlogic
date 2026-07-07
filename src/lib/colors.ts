export const COLORS = {
  bg: "#0A1628",
  surface: "#0D2440",
  surfaceRaised: "#112444",
  border: "rgba(63,183,255,0.10)",
  accent: "#3FB7FF",
  textPrimary: "#EDF1F5",
  textSecondary: "#8BA4BE",
  textMuted: "#4D6680",
  green: "#22C55E",
  amber: "#F59E0B",
  crimson: "#EF4444",
  greenDim: "rgba(34,197,94,0.12)",
  amberDim: "rgba(245,158,11,0.12)",
  crimsonDim: "rgba(239,68,68,0.12)",
} as const;

export type ColorKey = keyof typeof COLORS;
