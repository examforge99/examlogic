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

const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: "16px",
  padding: "20px",
  background:
    "linear-gradient(to bottom, #1E1B4B, #0F1535 30%, #080D1F) padding-box, linear-gradient(to bottom, #25d6a2, #3730A3) border-box",
  border: "2px solid transparent",
  boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
};

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 0 12px", gap: "10px" }}>
      <div style={{
        width: "64px", height: "64px", borderRadius: "50%",
        background: "rgba(255,255,255,0.04)",
        border: "2px dashed rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#3D4A5C" strokeWidth="2" />
          <path d="M12 3 A9 9 0 0 1 21 12" stroke="#25d6a2" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#D8E0E8", textAlign: "center" }}>
        No data yet
      </div>
      <div style={{ fontSize: "12px", color: "#7D8A9A", textAlign: "center", lineHeight: 1.5, maxWidth: "200px" }}>
        Complete a practice session to see your score distribution across subjects
      </div>
    </div>
  );
}

export default function ScoreDistribution({ subjects }: ScoreDistributionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const countRef = useRef<HTMLDivElement>(null);

  const isEmpty = !subjects || subjects.length === 0;

  const cx = 70, cy = 70, r = 52;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * r;
  const DURATION = 2400;
  const total = isEmpty ? 0 : subjects.reduce((sum, s) => sum + s.count, 0);

  let runningOffset = 0;
  const segments = isEmpty ? [] : subjects.map((s) => {
    const length = (s.count / total) * circumference;
    const seg = { ...s, fraction: s.count / total, length, startOffset: runningOffset };
    runningOffset += length;
    return seg;
  });

  useEffect(() => {
    if (isEmpty) return;
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
  }, [subjects, isEmpty]);

  return (
    <div style={CARD_STYLE}>

      {/* Header */}
      <div style={{ fontSize: "clamp(14px, 4vw, 16px)", fontWeight: 700, color: "#D8E0E8", marginBottom: "20px" }}>
        Score Distribution
      </div>

      {isEmpty ? <EmptyState /> : (
        <>
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
        </>
      )}

    </div>
  );
}
