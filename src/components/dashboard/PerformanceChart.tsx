import { useEffect, useRef } from "react";
import { getPerformanceColor, describeArc, arcLength, Subject } from "@/lib/performance";
import { COLORS } from "@/lib/colors";

interface AnimatedArcProps {
  d: string;
  stroke: string;
  strokeWidth: number;
  totalLen: number;
  fillLen: number;
  animated: boolean;
  delay: number;
}

function AnimatedArc({ d, stroke, strokeWidth, totalLen, fillLen, animated, delay }: AnimatedArcProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;

    el.style.strokeDasharray = `${totalLen} ${totalLen}`;

    if (!animated) {
      el.style.strokeDashoffset = `${totalLen - fillLen}`;
      return;
    }

    el.style.strokeDashoffset = `${totalLen}`;
    el.style.transition = "none";

    const timeout = setTimeout(() => {
      el.style.transition = `stroke-dashoffset 1.1s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`;
      el.style.strokeDashoffset = `${totalLen - fillLen}`;
    }, 60);

    return () => clearTimeout(timeout);
  }, [animated, fillLen, totalLen, delay]);

  return (
    <path
      ref={pathRef}
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 4px ${stroke}66)` }}
    />
  );
}

interface PerformanceChartProps {
  subjects: Subject[];
  animated: boolean;
}

export default function PerformanceChart({ subjects, animated }: PerformanceChartProps) {
  const SIZE = 210;
  const CENTER = SIZE / 2;
  const TRACK_R = 78;
  const GAP_DEG = 7;
  const STROKE_WIDTH = 17;

  const n = subjects.length;
  const sliceDeg = 360 / n;
  const arcDeg = sliceDeg - GAP_DEG;
  const avg = Math.round(subjects.reduce((a, s) => a + s.score, 0) / n);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {subjects.map((_, i) => {
            const startDeg = i * sliceDeg + GAP_DEG / 2;
            return (
              <path
                key={`track-${i}`}
                d={describeArc(CENTER, CENTER, TRACK_R, startDeg, startDeg + arcDeg)}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
              />
            );
          })}

          {subjects.map((subj, i) => {
            const startDeg = i * sliceDeg + GAP_DEG / 2;
            const totalLen = arcLength(TRACK_R, arcDeg);
            const fillLen = (subj.score / 100) * totalLen;
            return (
              <AnimatedArc
                key={subj.id}
                d={describeArc(CENTER, CENTER, TRACK_R, startDeg, startDeg + arcDeg)}
                stroke={getPerformanceColor(subj.score)}
                strokeWidth={STROKE_WIDTH}
                totalLen={totalLen}
                fillLen={fillLen}
                animated={animated}
                delay={i * 0.13}
              />
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.textPrimary,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {avg}
            <span style={{ fontSize: 18, fontWeight: 500, color: COLORS.textSecondary }}>%</span>
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.green,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
            }}
          >
            Overall
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 32px",
          width: "100%",
          maxWidth: 260,
        }}
      >
        {subjects.map((subj) => {
          const color = getPerformanceColor(subj.score);
          return (
            <div key={subj.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 3,
                  background: color,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${color}66`,
                }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>
                  {subj.shortLabel}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{subj.score}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
