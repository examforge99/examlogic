"use client";

import { useEffect, useRef } from "react";

interface Subject {
  name: string;
  count: number;
  color: string;
}

interface ScoreDistributionProps {
  subjects?: Subject[];
}

const defaultSubjects: Subject[] = [
  { name: "Mathematics", count: 524, color: "#3FB7FF" },
  { name: "Physics",     count: 411, color: "#8B5CF6" },
  { name: "Chemistry",   count: 212, color: "#25d6a2" },
  { name: "Biology",     count: 101, color: "#EAB308" },
];

const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: "16px",
  padding: "20px",
  background:
    "linear-gradient(to bottom, #1E1B4B, #0F1535 30%, #080D1F) padding-box, linear-gradient(to bottom, #25d6a2, #3730A3) border-box",
  border: "2px solid transparent",
  boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
};

export default function ScoreDistribution({
  subjects = defaultSubjects,
}: ScoreDistributionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const countRef = useRef<HTMLDivElement>(null);

  const cx = 70, cy = 70, r = 52;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * r;
  const DURATION = 2400;
  const total = subjects.reduce((sum, s) => sum + s.count, 0);

  let runningOffset = 0;
  const segments = subjects.map((s) => {
    const length = (s.count / total) * circumference;
    const seg = { ...s, fraction: s.count / total, length, startOffset: runningOffset };
    runningOffset += length;
    return seg;
  });

  useEffect(() => {
    const svg = svgRef.current;
    const countEl = countRef.current;
    if (!svg || !countEl) return;

    svg.innerHTML = "";

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", String(cx));
    bg.setAttribute("cy", String(cy));
    bg.setAttribute("r", String(r));
    bg.setAttribute("fill", "none");
    bg.setAttribute("stroke", "rgba(255,255,255,0.05)");
    bg.setAttribute("stroke-width", String(strokeWidth));
    svg.appendChild(bg);

    const segCircles: { circle: SVGCircleElement; seg: typeof segments[0] }[] = [];

    [...segments].reverse().forEach((seg, ri) => {
      const i = segments.length - 1 - ri;
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", seg.color);
      circle.setAttribute("stroke-width", String(strokeWidth));
      circle.setAttribute("stroke-dasharray", `${seg.length} ${circumference - seg.length}`);
      circle.setAttribute("stroke-dashoffset", String(circumference));
      svg.appendChild(circle);
      segCircles[i] = { circle, seg };
    });

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / DURATION, 1);
      const progress = easeInOut(rawProgress);
      const filledLength = progress * circumference;

      segCircles.forEach(({ circle, seg }) => {
        const segStart = seg.startOffset;
        const segEnd = seg.startOffset + seg.length;
        if (filledLength <= segStart) {
          circle.setAttribute("stroke-dashoffset", String(circumference));
        } else if (filledLength >= segEnd) {
          circle.setAttribute("stroke-dashoffset", String(circumference - segStart));
        } else {
          const filled = filledLength - segStart;
          circle.setAttribute("stroke-dasharray", `${filled} ${circumference - filled}`);
          circle.setAttribute("stroke-dashoffset", String(circumference - segStart));
        }
      });

      if (countEl) countEl.textContent = Math.floor(progress * total).toLocaleString();

      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        segCircles.forEach(({ circle, seg }) => {
          circle.setAttribute("stroke-dasharray", `${seg.length} ${circumference - seg.length}`);
          circle.setAttribute("stroke-dashoffset", String(circumference - seg.startOffset));
        });
        if (countEl) countEl.textContent = total.toLocaleString();
      }
    }

    requestAnimationFrame(animate);
  }, [subjects]);

  return (
    <div style={CARD_STYLE}>

      {/* Header */}
      <div style={{ fontSize: "clamp(14px, 4vw, 16px)", fontWeight: 700, color: "#D8E0E8", marginBottom: "20px" }}>
        Score Distribution
      </div>

      {/* Body */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>

        {/* Donut */}
        <div style={{ position: "relative", width: "clamp(110px, 30vw, 150px)", height: "clamp(110px, 30vw, 150px)", flexShrink: 0 }}>
          <svg
            ref={svgRef}
            viewBox="0 0 140 140"
            style={{ width: "100%", height: "100%", transform: "rotate(90deg)" }}
          />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
            <div ref={countRef} style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 700, color: "#D8E0E8", lineHeight: 1 }}>
              0
            </div>
            <div style={{ fontSize: "clamp(9px, 2.5vw, 11px)", color: "#7D8A9A", marginTop: "4px" }}>Total</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "clamp(11px, 3vw, 13px)", color: "#D8E0E8", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {seg.name}
              </span>
              <span style={{ fontSize: "clamp(10px, 2.5vw, 12px)", color: "#7D8A9A", whiteSpace: "nowrap", flexShrink: 0 }}>
                {Math.round(seg.fraction * 100)}% ({seg.count})
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "20px", fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 500, color: "#3FB7FF", cursor: "pointer" }}>
        View Detailed Analytics ›
      </div>

    </div>
  );
    }
