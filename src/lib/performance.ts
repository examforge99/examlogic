import { COLORS } from "./colors";

export interface Subject {
  id: string;
  label: string;
  shortLabel: string;
  score: number;
}

export function getPerformanceColor(score: number): string {
  if (score >= 70) return COLORS.green;
  if (score >= 40) return COLORS.amber;
  return COLORS.crimson;
}

export function getPerformanceDim(score: number): string {
  if (score >= 70) return COLORS.greenDim;
  if (score >= 40) return COLORS.amberDim;
  return COLORS.crimsonDim;
}

export function getPerformanceLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 40) return "Needs work";
  return "Critical";
}

export function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export function arcLength(r: number, deg: number): number {
  return (Math.PI * r * deg) / 180;
}
