import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PerformanceChart from "./PerformanceChart";
import {
  getPerformanceColor,
  getPerformanceDim,
  getPerformanceLabel,
  Subject,
} from "@/lib/performance";
import { COLORS } from "@/lib/colors";

interface PerformanceSectionProps {
  subjects: Subject[];
}

export default function PerformanceSection({ subjects }: PerformanceSectionProps) {
  const [chartAnimated, setChartAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setChartAnimated(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 24,
        padding: "22px 18px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 0 60px -20px rgba(34,197,94,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>
          Performance
        </span>
        <div style={{ display: "flex", gap: 5 }}>
          {subjects.map((s) => (
            <div
              key={s.id}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: getPerformanceColor(s.score),
                boxShadow: `0 0 5px ${getPerformanceColor(s.score)}88`,
              }}
            />
          ))}
        </div>
      </div>

      <PerformanceChart subjects={subjects} animated={chartAnimated} />

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 11 }}>
        {subjects.map((subj, i) => {
          const color = getPerformanceColor(subj.score);
          return (
            <motion.div
              key={subj.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.3 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  width: 88,
                  flexShrink: 0,
                }}
              >
                {subj.label}
              </span>

              <div
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subj.score}%` }}
                  transition={{ duration: 1.1, delay: 0.3 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: color,
                    boxShadow: `0 0 6px ${color}66`,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  width: 96,
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>
                  {subj.score}%
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color,
                    background: getPerformanceDim(subj.score),
                    borderRadius: 6,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getPerformanceLabel(subj.score)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
      }
