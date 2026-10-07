export const COLORS = {
  bg: "#E8E8E5",
  surface: "#F7F7F3",
  surfaceRaised: "#FFFFFF",
  border: "#D8D9D6",
  accent: "#3FB7FF",
  textPrimary: "#171A1C",
  textSecondary: "#4B5560",
  textMuted: "#737B83",
  green: "#25D6A2",
  amber: "#D89B16",
  crimson: "#D64545",
  greenDim: "rgba(37,214,162,0.12)",
  amberDim: "rgba(216,155,22,0.12)",
  crimsonDim: "rgba(214,69,69,0.12)",
} as const;

export type ColorKey = keyof typeof COLORS;
